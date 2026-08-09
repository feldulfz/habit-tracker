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
import { createActivity, currentStreak } from "../lib/activity";
import { addDays, localDate } from "../lib/dates";
import { useTasks } from "../hooks/use-tasks";
import { ActivityOverview } from "./activity-overview";
import { AddTaskDialog } from "./add-task-dialog";
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
    toggleToday,
    archiveTask,
  } = useTasks(session);
  const [showAddTask, setShowAddTask] = useState(false);
  const today = localDate();

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
  const streak = useMemo(() => currentStreak(completions), [completions]);
  const lastSevenCount = useMemo(() => {
    const cutoff = localDate(addDays(new Date(), -6));
    return completions.filter((item) => item.completion_date >= cutoff).length;
  }, [completions]);

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
          completedToday={completedToday.size}
          lastSevenCount={lastSevenCount}
          streak={streak}
        />

        <TaskList
          completedToday={completedToday}
          loading={loading}
          onAddTask={() => setShowAddTask(true)}
          onArchiveTask={archiveTask}
          onSelectTask={setSelectedTaskId}
          onToggleTask={toggleToday}
          selectedTaskId={selectedTaskId}
          tasks={tasks}
        />

        {selectedTask && (
          <TaskDetail
            activity={taskActivity}
            completionCount={
              completions.filter((item) => item.task_id === selectedTask.id)
                .length
            }
            task={selectedTask}
          />
        )}
      </div>

      {showAddTask && (
        <AddTaskDialog
          onClose={() => setShowAddTask(false)}
          onSubmit={addTask}
        />
      )}
    </main>
  );
}
