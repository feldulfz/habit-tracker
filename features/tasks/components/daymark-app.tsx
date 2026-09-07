"use client";

import { useMemo, useState } from "react";
import { LoginScreen } from "@/features/auth/components/login-screen";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Brand } from "@/shared/components/brand";
import {
  supabase,
  supabaseConfigured,
} from "@/shared/lib/supabase/client";
import { demoUser } from "../data/demo";
import { createActivity, currentStreak, isGoalMet } from "../lib/activity";
import { addDays, localDate } from "../lib/dates";
import type { Task } from "../model/types";
import { useTasks } from "../hooks/use-tasks";
import { ActivityOverview } from "./activity-overview";
import { LogTimeDialog } from "./log-time-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskDetail } from "./task-detail";
import { TaskList } from "./task-list";

export function DaymarkApp() {
  const { session, authReady, authError, signIn, signOut } = useAuth();
  const {
    tasks,
    completions,
    selectedTaskId,
    loading,
    error,
    setError,
    setSelectedTaskId,
    addTask,
    updateTask,
    saveToday,
    removeToday,
    archiveTask,
  } = useTasks(session);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loggingTask, setLoggingTask] = useState<Task | null>(null);
  const today = localDate();

  const todayCompletions = useMemo(
    () =>
      new Map(
        completions
          .filter((item) => item.completion_date === today)
          .map((item) => [item.task_id, item]),
      ),
    [completions, today],
  );
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const completedToday = useMemo(
    () =>
      completions.filter(
        (item) =>
          item.completion_date === today &&
          isGoalMet(item, tasksById.get(item.task_id)),
      ).length,
    [completions, tasksById, today],
  );
  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null;
  const overallActivity = useMemo(
    () => createActivity(completions, tasks),
    [completions, tasks],
  );
  const taskActivity = useMemo(
    () => createActivity(completions, tasks, selectedTask?.id),
    [completions, selectedTask?.id, tasks],
  );
  const streak = useMemo(
    () => currentStreak(completions, tasks),
    [completions, tasks],
  );
  const lastSevenCount = useMemo(() => {
    const cutoff = localDate(addDays(new Date(), -6));
    return completions.filter(
      (item) =>
        item.completion_date >= cutoff &&
        isGoalMet(item, tasksById.get(item.task_id)),
    ).length;
  }, [completions, tasksById]);

  if (!authReady) {
    return (
      <main className="center-screen">
        <div className="loading-mark" aria-label="Loading Daymark" />
      </main>
    );
  }

  if (supabaseConfigured && !session) {
    return <LoginScreen error={authError} onSignIn={signIn} />;
  }

  const email = session?.user.email ?? demoUser;
  const avatar =
    session?.user.user_metadata?.avatar_url ??
    session?.user.user_metadata?.picture;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="account">
          {!supabaseConfigured && (
            <span className="preview-pill">Preview mode</span>
          )}
          <span className="account-email">{email}</span>
          <span className="avatar" aria-hidden="true">
            {avatar ? <img alt="" src={avatar} /> : email[0].toUpperCase()}
          </span>
          {supabase && (
            <button className="text-button" onClick={signOut} type="button">
              Sign out
            </button>
          )}
        </div>
      </header>

      <div className="content">
        {!supabaseConfigured && (
          <div className="setup-banner">
            <span>
              You’re viewing a working preview. Add your Supabase keys to turn
              on Google sign-in and cloud sync.
            </span>
          </div>
        )}

        <section className="hero">
          <div>
            <p className="eyebrow">Your daily practice</p>
            <h1>Good afternoon.</h1>
            <p className="hero-subtitle">
              Keep today simple. Mark the things that matter.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowAddTask(true)}
            type="button"
          >
            <span aria-hidden="true">＋</span> Add task
          </button>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} type="button">
              Dismiss
            </button>
          </div>
        )}

        <ActivityOverview
          activity={overallActivity}
          completedToday={completedToday}
          lastSevenCount={lastSevenCount}
          streak={streak}
        />

        <TaskList
          loading={loading}
          onAddTask={() => setShowAddTask(true)}
          onArchiveTask={archiveTask}
          onLogTime={setLoggingTask}
          onSelectTask={setSelectedTaskId}
          selectedTaskId={selectedTaskId}
          tasks={tasks}
          todayCompletions={todayCompletions}
        />

        {selectedTask && (
          <TaskDetail
            activity={taskActivity}
            completionCount={
              completions.filter((item) => item.task_id === selectedTask.id)
                .length
            }
            onEdit={() => setEditingTask(selectedTask)}
            task={selectedTask}
            totalMinutes={completions
              .filter((item) => item.task_id === selectedTask.id)
              .reduce((sum, item) => sum + item.actual_minutes, 0)}
          />
        )}
      </div>

      {showAddTask && (
        <TaskFormDialog
          onClose={() => setShowAddTask(false)}
          onSubmit={addTask}
        />
      )}

      {editingTask && (
        <TaskFormDialog
          onClose={() => setEditingTask(null)}
          onSubmit={(values) => updateTask(editingTask, values)}
          task={editingTask}
        />
      )}

      {loggingTask && (
        <LogTimeDialog
          completion={todayCompletions.get(loggingTask.id)}
          onClose={() => setLoggingTask(null)}
          onRemove={() => removeToday(loggingTask)}
          onSubmit={(minutes) => saveToday(loggingTask, minutes)}
          task={loggingTask}
        />
      )}
    </main>
  );
}
