"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  supabase,
  supabaseConfigured,
} from "@/shared/lib/supabase/client";
import { demoTasks, makeDemoCompletions } from "../data/demo";
import { addDays, localDate } from "../lib/dates";
import type {
  Completion,
  HabitNote,
  Task,
  TaskValues,
} from "../model/types";

export function useTasks(session: Session | null) {
  const [tasks, setTasks] = useState<Task[]>(
    supabaseConfigured ? [] : demoTasks,
  );
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>(
    supabaseConfigured ? [] : makeDemoCompletions(),
  );
  const [habitNotes, setHabitNotes] = useState<HabitNote[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    supabaseConfigured ? null : demoTasks[0].id,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!supabase || !session) return;

    setLoading(true);
    setError("");
    const startDate = localDate(addDays(new Date(), -364));
    const [taskResult, completionResult, noteResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("task_completions")
        .select("*")
        .gte("completion_date", startDate)
        .order("completion_date", { ascending: true }),
      supabase
        .from("habit_notes")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

    if (taskResult.error || completionResult.error || noteResult.error) {
      setError(
        taskResult.error?.message ??
          completionResult.error?.message ??
          noteResult.error?.message ??
          "Your tasks could not be loaded.",
      );
    } else {
      const allTasks = (taskResult.data ?? []) as Task[];
      const nextTasks = allTasks.filter((task) => !task.archived_at);
      setTasks(nextTasks);
      setArchivedTasks(allTasks.filter((task) => task.archived_at));
      setCompletions((completionResult.data ?? []) as Completion[]);
      setHabitNotes((noteResult.data ?? []) as HabitNote[]);
      setSelectedTaskId((current) =>
        nextTasks.some((task) => task.id === current)
          ? current
          : (nextTasks[0]?.id ?? null),
      );
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addTask(values: TaskValues) {
    const title = values.title.trim();
    if (!title) return false;

    setError("");
    if (!supabase || !session) {
      const task: Task = {
        id: crypto.randomUUID(),
        user_id: "demo",
        title,
        note: values.note.trim() || null,
        minimum_minutes: values.minimumMinutes,
        created_at: new Date().toISOString(),
        archived_at: null,
      };
      setTasks((current) => [...current, task]);
      setSelectedTaskId(task.id);
      return true;
    }

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: session.user.id,
        title,
        note: values.note.trim() || null,
        minimum_minutes: values.minimumMinutes,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    setTasks((current) => [...current, data as Task]);
    setSelectedTaskId((data as Task).id);
    return true;
  }

  async function updateTask(task: Task, values: TaskValues) {
    const title = values.title.trim();
    if (!title) return false;

    const updates = {
      title,
      note: values.note.trim() || null,
      minimum_minutes: values.minimumMinutes,
    };
    setError("");

    if (supabase && session) {
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task.id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? (data as Task) : item)),
      );
      return true;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, ...updates } : item,
      ),
    );
    return true;
  }

  async function saveToday(task: Task, actualMinutes: number) {
    const today = localDate();
    const existing = completions.find(
      (item) =>
        item.task_id === task.id && item.completion_date === today,
    );
    setError("");

    if (!supabase || !session) {
      setCompletions((current) =>
        existing
          ? current.map((item) =>
              item.id === existing.id
                ? { ...item, actual_minutes: actualMinutes }
                : item,
            )
          : [
              ...current,
              {
                id: crypto.randomUUID(),
                task_id: task.id,
                user_id: "demo",
                completion_date: today,
                actual_minutes: actualMinutes,
                completed_at: new Date().toISOString(),
              },
            ],
      );
      return true;
    }

    if (existing) {
      const { data, error: updateError } = await supabase
        .from("task_completions")
        .update({ actual_minutes: actualMinutes })
        .eq("id", existing.id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      setCompletions((current) =>
        current.map((item) =>
          item.id === existing.id ? (data as Completion) : item,
        ),
      );
      return true;
    }

    const { data, error: insertError } = await supabase
      .from("task_completions")
      .insert({
        task_id: task.id,
        user_id: session.user.id,
        completion_date: today,
        actual_minutes: actualMinutes,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    setCompletions((current) => [...current, data as Completion]);
    return true;
  }

  async function removeToday(task: Task) {
    const today = localDate();
    const existing = completions.find(
      (item) =>
        item.task_id === task.id && item.completion_date === today,
    );
    if (!existing) return true;
    setError("");

    if (supabase && session) {
      const { error: deleteError } = await supabase
        .from("task_completions")
        .delete()
        .eq("id", existing.id);
      if (deleteError) {
        setError(deleteError.message);
        return false;
      }
    }

    setCompletions((current) =>
      current.filter((item) => item.id !== existing.id),
    );
    return true;
  }

  async function addHabitNote(taskId: string, body: string) {
    const trimmedBody = body.trim();
    if (!trimmedBody) return false;

    setError("");
    if (!supabase || !session) {
      const timestamp = new Date().toISOString();
      setHabitNotes((current) => [
        {
          id: crypto.randomUUID(),
          task_id: taskId,
          user_id: "demo",
          body: trimmedBody,
          created_at: timestamp,
          updated_at: timestamp,
        },
        ...current,
      ]);
      return true;
    }

    const { data, error: insertError } = await supabase
      .from("habit_notes")
      .insert({
        task_id: taskId,
        user_id: session.user.id,
        body: trimmedBody,
      })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return false;
    }

    setHabitNotes((current) => [data as HabitNote, ...current]);
    return true;
  }

  async function updateHabitNote(note: HabitNote, body: string) {
    const trimmedBody = body.trim();
    if (!trimmedBody) return false;

    const updatedAt = new Date().toISOString();
    setError("");
    if (supabase && session) {
      const { data, error: updateError } = await supabase
        .from("habit_notes")
        .update({ body: trimmedBody, updated_at: updatedAt })
        .eq("id", note.id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      setHabitNotes((current) =>
        current.map((item) =>
          item.id === note.id ? (data as HabitNote) : item,
        ),
      );
      return true;
    }

    setHabitNotes((current) =>
      current.map((item) =>
        item.id === note.id
          ? { ...item, body: trimmedBody, updated_at: updatedAt }
          : item,
      ),
    );
    return true;
  }

  async function deleteHabitNote(note: HabitNote) {
    if (!window.confirm("Delete this note?")) return false;

    setError("");
    if (supabase && session) {
      const { error: deleteError } = await supabase
        .from("habit_notes")
        .delete()
        .eq("id", note.id);
      if (deleteError) {
        setError(deleteError.message);
        return false;
      }
    }

    setHabitNotes((current) =>
      current.filter((item) => item.id !== note.id),
    );
    return true;
  }

  async function archiveTask(task: Task) {
    if (!window.confirm(`Archive “${task.title}”?`)) return;

    const archivedAt = new Date().toISOString();

    if (supabase && session) {
      const { error: archiveError } = await supabase
        .from("tasks")
        .update({ archived_at: archivedAt })
        .eq("id", task.id);
      if (archiveError) {
        setError(archiveError.message);
        return;
      }
    }

    const remaining = tasks.filter((item) => item.id !== task.id);
    setTasks(remaining);
    setArchivedTasks((current) => [
      ...current,
      { ...task, archived_at: archivedAt },
    ]);
    setSelectedTaskId(remaining[0]?.id ?? null);
  }

  async function restoreTask(task: Task) {
    setError("");
    let restoredTask: Task = { ...task, archived_at: null };

    if (supabase && session) {
      const { data, error: restoreError } = await supabase
        .from("tasks")
        .update({ archived_at: null })
        .eq("id", task.id)
        .select()
        .single();
      if (restoreError) {
        setError(restoreError.message);
        return;
      }
      restoredTask = data as Task;
    }

    setArchivedTasks((current) =>
      current.filter((item) => item.id !== task.id),
    );
    setTasks((current) =>
      [...current, restoredTask].sort((first, second) =>
        first.created_at.localeCompare(second.created_at),
      ),
    );
    setSelectedTaskId((current) => current ?? restoredTask.id);
  }

  return {
    tasks,
    archivedTasks,
    completions,
    habitNotes,
    selectedTaskId,
    loading,
    error,
    setError,
    setSelectedTaskId,
    addTask,
    updateTask,
    saveToday,
    removeToday,
    addHabitNote,
    updateHabitNote,
    deleteHabitNote,
    archiveTask,
    restoreTask,
  };
}
