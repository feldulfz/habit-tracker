"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";

type Task = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  created_at: string;
  archived_at: string | null;
};

type Completion = {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
};

const DAY_MS = 86_400_000;

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function createActivity(
  completions: Completion[],
  taskId?: string,
): Activity[] {
  const today = new Date();
  const start = addDays(today, -364);
  const counts = new Map<string, number>();

  completions.forEach((completion) => {
    if (!taskId || completion.task_id === taskId) {
      counts.set(
        completion.completion_date,
        (counts.get(completion.completion_date) ?? 0) + 1,
      );
    }
  });

  return Array.from({ length: 365 }, (_, index) => {
    const date = localDate(addDays(start, index));
    const count = counts.get(date) ?? 0;
    const level = taskId
      ? count > 0
        ? 4
        : 0
      : count === 0
        ? 0
        : count === 1
          ? 1
          : count === 2
            ? 2
            : count === 3
              ? 3
              : 4;

    return { date, count, level };
  });
}

function currentStreak(completions: Completion[]) {
  const activeDays = new Set(completions.map((item) => item.completion_date));
  let cursor = new Date();
  let streak = 0;

  if (!activeDays.has(localDate(cursor))) {
    cursor = addDays(cursor, -1);
  }

  while (activeDays.has(localDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

const demoUser = "hello@daymark.app";
const demoTasks: Task[] = [
  {
    id: "demo-move",
    user_id: "demo",
    title: "Move for 30 minutes",
    note: "Walk, run, stretch, or anything that gets you moving.",
    created_at: new Date(Date.now() - 56 * DAY_MS).toISOString(),
    archived_at: null,
  },
  {
    id: "demo-read",
    user_id: "demo",
    title: "Read 10 pages",
    note: "A small daily promise to yourself.",
    created_at: new Date(Date.now() - 43 * DAY_MS).toISOString(),
    archived_at: null,
  },
  {
    id: "demo-plan",
    user_id: "demo",
    title: "Plan tomorrow",
    note: null,
    created_at: new Date(Date.now() - 21 * DAY_MS).toISOString(),
    archived_at: null,
  },
];

function makeDemoCompletions() {
  const output: Completion[] = [];
  const now = new Date();

  for (let offset = 0; offset < 74; offset += 1) {
    const date = localDate(addDays(now, -offset));
    demoTasks.forEach((task, taskIndex) => {
      const cadence = taskIndex === 0 ? 5 : taskIndex === 1 ? 4 : 3;
      if ((offset * (taskIndex + 2) + taskIndex) % 7 < cadence) {
        output.push({
          id: `demo-${task.id}-${date}`,
          task_id: task.id,
          user_id: "demo",
          completion_date: date,
          completed_at: new Date().toISOString(),
        });
      }
    });
  }

  return output;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [tasks, setTasks] = useState<Task[]>(
    supabaseConfigured ? [] : demoTasks,
  );
  const [completions, setCompletions] = useState<Completion[]>(
    supabaseConfigured ? [] : makeDemoCompletions(),
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    supabaseConfigured ? null : demoTasks[0].id,
  );
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [error, setError] = useState("");
  const today = localDate();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !session) return;

    setLoading(true);
    setError("");
    const startDate = localDate(addDays(new Date(), -364));
    const [taskResult, completionResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("task_completions")
        .select("*")
        .gte("completion_date", startDate)
        .order("completion_date", { ascending: true }),
    ]);

    if (taskResult.error || completionResult.error) {
      setError(
        taskResult.error?.message ??
          completionResult.error?.message ??
          "Your tasks could not be loaded.",
      );
    } else {
      const nextTasks = (taskResult.data ?? []) as Task[];
      setTasks(nextTasks);
      setCompletions((completionResult.data ?? []) as Completion[]);
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

  const completedToday = useMemo(
    () =>
      new Set(
        completions
          .filter((item) => item.completion_date === today)
          .map((item) => item.task_id),
      ),
    [completions, today],
  );

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null;
  const overallActivity = useMemo(
    () => createActivity(completions),
    [completions],
  );
  const taskActivity = useMemo(
    () => createActivity(completions, selectedTask?.id),
    [completions, selectedTask?.id],
  );
  const streak = useMemo(
    () => currentStreak(completions),
    [completions],
  );
  const lastSevenCount = useMemo(() => {
    const cutoff = localDate(addDays(new Date(), -6));
    return completions.filter((item) => item.completion_date >= cutoff).length;
  }, [completions]);

  async function signIn() {
    if (!supabase) return;
    setError("");
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (signInError) setError(signInError.message);
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    setError("");
    if (!supabase || !session) {
      const task: Task = {
        id: crypto.randomUUID(),
        user_id: "demo",
        title,
        note: taskNote.trim() || null,
        created_at: new Date().toISOString(),
        archived_at: null,
      };
      setTasks((current) => [...current, task]);
      setSelectedTaskId(task.id);
    } else {
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: session.user.id,
          title,
          note: taskNote.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }
      setTasks((current) => [...current, data as Task]);
      setSelectedTaskId((data as Task).id);
    }

    setTaskTitle("");
    setTaskNote("");
    setShowAddTask(false);
  }

  async function toggleToday(task: Task) {
    const existing = completions.find(
      (item) =>
        item.task_id === task.id && item.completion_date === today,
    );
    setError("");

    if (!supabase || !session) {
      setCompletions((current) =>
        existing
          ? current.filter((item) => item.id !== existing.id)
          : [
              ...current,
              {
                id: crypto.randomUUID(),
                task_id: task.id,
                user_id: "demo",
                completion_date: today,
                completed_at: new Date().toISOString(),
              },
            ],
      );
      return;
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("task_completions")
        .delete()
        .eq("id", existing.id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        setCompletions((current) =>
          current.filter((item) => item.id !== existing.id),
        );
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("task_completions")
        .insert({
          task_id: task.id,
          user_id: session.user.id,
          completion_date: today,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else {
        setCompletions((current) => [...current, data as Completion]);
      }
    }
  }

  async function archiveTask(task: Task) {
    if (!window.confirm(`Archive “${task.title}”?`)) return;

    if (supabase && session) {
      const { error: archiveError } = await supabase
        .from("tasks")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", task.id);
      if (archiveError) {
        setError(archiveError.message);
        return;
      }
    }

    const remaining = tasks.filter((item) => item.id !== task.id);
    setTasks(remaining);
    setSelectedTaskId(remaining[0]?.id ?? null);
  }

  if (!authReady) {
    return (
      <main className="center-screen">
        <div className="loading-mark" aria-label="Loading Daymark" />
      </main>
    );
  }

  if (supabaseConfigured && !session) {
    return (
      <main className="login-page">
        <section className="login-copy">
          <a className="brand brand-large" href="/" aria-label="Daymark home">
            <span className="brand-mark" aria-hidden="true">
              D
            </span>
            <span>Daymark</span>
          </a>
          <p className="eyebrow">Small promises. Visible progress.</p>
          <h1>Make consistency something you can see.</h1>
          <p className="login-description">
            A quiet daily task list with a year of progress built right in.
            Check in, mark it done, and let the days add up.
          </p>
          <button className="google-button" onClick={signIn} type="button">
            <span className="google-g" aria-hidden="true">
              G
            </span>
            Continue with Google
          </button>
          {error && <p className="error-message">{error}</p>}
          <p className="privacy-note">
            No password to remember. Daymark only uses your Google account to
            keep your tasks private and synced.
          </p>
        </section>
        <section className="login-visual" aria-hidden="true">
          <div className="visual-card">
            <div className="visual-topline">
              <span>This year</span>
              <span>184 days marked</span>
            </div>
            <div className="visual-grid">
              {Array.from({ length: 140 }, (_, index) => (
                <span
                  className={`visual-cell visual-level-${(index * 7 + index * index) % 5}`}
                  key={index}
                />
              ))}
            </div>
            <div className="visual-quote">
              “A little, often, becomes a lot.”
            </div>
          </div>
        </section>
      </main>
    );
  }

  const email = session?.user.email ?? demoUser;
  const avatar =
    session?.user.user_metadata?.avatar_url ??
    session?.user.user_metadata?.picture;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daymark home">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span>Daymark</span>
        </a>
        <div className="account">
          {!supabaseConfigured && (
            <span className="preview-pill">Preview mode</span>
          )}
          <span className="account-email">{email}</span>
          <span className="avatar" aria-hidden="true">
            {avatar ? <img alt="" src={avatar} /> : email[0].toUpperCase()}
          </span>
          {supabase && (
            <button
              className="text-button"
              onClick={() => supabase.auth.signOut()}
              type="button"
            >
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

        <section className="activity-card">
          <div className="card-heading">
            <div>
              <p className="section-label">THE LAST 365 DAYS</p>
              <h2>Your year in small wins</h2>
            </div>
            <div className="legend" aria-label="Activity legend">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <i className={`legend-cell level-${level}`} key={level} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="calendar-wrap">
            <ActivityCalendar
              blockMargin={4}
              blockRadius={3}
              blockSize={12}
              colorScheme="light"
              data={overallActivity}
              fontSize={12}
              labels={{
                totalCount: "{{count}} completions in the last year",
                legend: { less: "Less", more: "More" },
              }}
              maxLevel={4}
              showColorLegend={false}
              showTotalCount={false}
              showWeekdayLabels
              theme={{
                light: ["#e8e7df", "#c6e3bf", "#79b985", "#36805b", "#174c39"],
              }}
              weekStart={1}
            />
          </div>
          <div className="stats-row">
            <div>
              <strong>{completedToday.size}</strong>
              <span>completed today</span>
            </div>
            <div>
              <strong>{streak}</strong>
              <span>day streak</span>
            </div>
            <div>
              <strong>{lastSevenCount}</strong>
              <span>marks this week</span>
            </div>
          </div>
        </section>

        <section className="today-section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(new Date())}
              </p>
              <h2>Today’s tasks</h2>
            </div>
            <span className="today-progress">
              {completedToday.size} of {tasks.length} complete
            </span>
          </div>

          {loading ? (
            <div className="task-empty">Loading your tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="task-empty">
              <span className="empty-mark">✓</span>
              <h3>Your list is clear.</h3>
              <p>Add one small thing you want to return to each day.</p>
              <button
                className="secondary-button"
                onClick={() => setShowAddTask(true)}
                type="button"
              >
                Add your first task
              </button>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => {
                const done = completedToday.has(task.id);
                const selected = selectedTaskId === task.id;
                return (
                  <div
                    className={`task-row ${done ? "task-done" : ""} ${selected ? "task-selected" : ""}`}
                    key={task.id}
                  >
                    <button
                      aria-label={
                        done
                          ? `Mark ${task.title} incomplete`
                          : `Mark ${task.title} complete`
                      }
                      aria-pressed={done}
                      className="check-button"
                      onClick={() => toggleToday(task)}
                      type="button"
                    >
                      <span aria-hidden="true">{done ? "✓" : ""}</span>
                    </button>
                    <button
                      className="task-copy"
                      onClick={() => setSelectedTaskId(task.id)}
                      type="button"
                    >
                      <strong>{task.title}</strong>
                      <span>
                        {task.note || "Click to see this task’s history"}
                      </span>
                    </button>
                    <span className="task-status">
                      {done ? "Marked today" : "Not yet"}
                    </span>
                    <button
                      aria-label={`Archive ${task.title}`}
                      className="more-button"
                      onClick={() => archiveTask(task)}
                      title="Archive task"
                      type="button"
                    >
                      ···
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {selectedTask && (
          <section className="task-detail">
            <div className="detail-heading">
              <div>
                <p className="section-label">TASK HISTORY</p>
                <h2>{selectedTask.title}</h2>
                <p>
                  {selectedTask.note ||
                    "Every filled square is a day you kept this promise."}
                </p>
              </div>
              <div className="detail-count">
                <strong>
                  {
                    completions.filter(
                      (item) => item.task_id === selectedTask.id,
                    ).length
                  }
                </strong>
                <span>days marked</span>
              </div>
            </div>
            <div className="calendar-wrap compact-calendar">
              <ActivityCalendar
                blockMargin={4}
                blockRadius={3}
                blockSize={10}
                colorScheme="light"
                data={taskActivity}
                fontSize={11}
                maxLevel={4}
                showColorLegend={false}
                showTotalCount={false}
                theme={{
                  light: [
                    "#e8e7df",
                    "#174c39",
                    "#174c39",
                    "#174c39",
                    "#174c39",
                  ],
                }}
                weekStart={1}
              />
            </div>
          </section>
        )}
      </div>

      {showAddTask && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowAddTask(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="add-task-title"
            aria-modal="true"
            className="modal"
            role="dialog"
          >
            <button
              aria-label="Close add task dialog"
              className="modal-close"
              onClick={() => setShowAddTask(false)}
              type="button"
            >
              ×
            </button>
            <p className="section-label">A DAILY PROMISE</p>
            <h2 id="add-task-title">Add a task</h2>
            <p className="modal-intro">
              Keep it clear and repeatable. This task will appear every day.
            </p>
            <form onSubmit={addTask}>
              <label htmlFor="task-title">Task name</label>
              <input
                autoFocus
                id="task-title"
                maxLength={80}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="e.g. Practice Spanish for 15 minutes"
                required
                value={taskTitle}
              />
              <label htmlFor="task-note">
                A short note <span>Optional</span>
              </label>
              <textarea
                id="task-note"
                maxLength={240}
                onChange={(event) => setTaskNote(event.target.value)}
                placeholder="Why does this matter to you?"
                rows={3}
                value={taskNote}
              />
              <div className="modal-actions">
                <button
                  className="cancel-button"
                  onClick={() => setShowAddTask(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Add daily task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
