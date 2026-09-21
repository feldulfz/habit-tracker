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
  } = useTasks(session);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loggingTask, setLoggingTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activityView, setActivityView] = useState<"overall" | "habit">(
    "overall",
  );
  const [mobilePanel, setMobilePanel] = useState<"today" | "activity">(
    "today",
  );
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
          <details className="account-menu">
            <summary aria-label="Open account menu" className="account-trigger">
              <span className="avatar" aria-hidden="true">
                {avatar ? <img alt="" src={avatar} /> : email[0].toUpperCase()}
              </span>
            </summary>
            <div className="account-popover">
              <button className="account-menu-item" disabled type="button">
                <span>Profile</span>
                <small>Coming soon</small>
              </button>
              <button
                className="account-menu-item"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  setShowArchived(true);
                }}
                type="button"
              >
                <span>Archived habits</span>
                <small>{archivedTasks.length}</small>
              </button>
              {supabase && (
                <>
                  <div className="account-menu-divider" />
                  <button
                    className="account-menu-item"
                    onClick={signOut}
                    type="button"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </details>
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

        <section className="compact-hero">
          <div>
            <p className="section-label">Your daily practice</p>
            <h1>Good afternoon.</h1>
            <p className="compact-hero-copy">
              Keep today simple. Mark the things that matter.
            </p>
          </div>
          <button
            className="primary-button compact-add"
            onClick={() => setShowAddTask(true)}
            type="button"
          >
            <span aria-hidden="true">＋</span>
            Add habit
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

        <div className="mobile-workspace-tabs" role="tablist" aria-label="Dashboard sections">
          <button
            aria-selected={mobilePanel === "today"}
            className={mobilePanel === "today" ? "active" : ""}
            onClick={() => setMobilePanel("today")}
            role="tab"
            type="button"
          >
            Today
          </button>
          <button
            aria-selected={mobilePanel === "activity"}
            className={mobilePanel === "activity" ? "active" : ""}
            onClick={() => setMobilePanel("activity")}
            role="tab"
            type="button"
          >
            Activity
          </button>
        </div>

        <div className="workspace">
          <div
            className={`workspace-column habits-column ${mobilePanel !== "today" ? "mobile-hidden" : ""}`}
          >
            <TaskList
              loading={loading}
              onAddTask={() => setShowAddTask(true)}
              onArchiveTask={archiveTask}
              onLogTime={setLoggingTask}
              onSelectTask={(taskId) => {
                setSelectedTaskId(taskId);
                setActivityView("habit");
                setMobilePanel("activity");
              }}
              selectedTaskId={selectedTaskId}
              tasks={tasks}
              todayCompletions={todayCompletions}
            />
          </div>

          <section
            className={`workspace-column activity-workspace ${mobilePanel !== "activity" ? "mobile-hidden" : ""}`}
          >
            <div className="activity-tabs" role="tablist" aria-label="Activity view">
              <button
                aria-selected={activityView === "overall"}
                className={`activity-tab ${activityView === "overall" ? "active" : ""}`}
                onClick={() => setActivityView("overall")}
                role="tab"
                type="button"
              >
                Overall
              </button>
              {selectedTask && (
                <button
                  aria-selected={activityView === "habit"}
                  className={`activity-tab habit-tab ${activityView === "habit" ? "active" : ""}`}
                  onClick={() => setActivityView("habit")}
                  role="tab"
                  title={selectedTask.title}
                  type="button"
                >
                  {selectedTask.title}
                </button>
              )}
            </div>

            <div className="activity-view">
              {activityView === "habit" && selectedTask ? (
                <TaskDetail
                  activity={taskActivity}
                  completionCount={
                    completions.filter(
                      (item) => item.task_id === selectedTask.id,
                    ).length
                  }
                  key={selectedTask.id}
                  notes={habitNotes.filter(
                    (note) => note.task_id === selectedTask.id,
                  )}
                  onAddNote={(body) => addHabitNote(selectedTask.id, body)}
                  onDeleteNote={deleteHabitNote}
                  onEdit={() => setEditingTask(selectedTask)}
                  onUpdateNote={updateHabitNote}
                  task={selectedTask}
                  totalMinutes={completions
                    .filter((item) => item.task_id === selectedTask.id)
                    .reduce((sum, item) => sum + item.actual_minutes, 0)}
                />
              ) : (
                <ActivityOverview
                  activity={overallActivity}
                  completedToday={completedToday}
                  lastSevenCount={lastSevenCount}
                  streak={streak}
                  totalHabits={tasks.length}
                />
              )}
            </div>
          </section>
        </div>
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

      {showArchived && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowArchived(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="archived-habits-title"
            aria-modal="true"
            className="modal archived-modal"
            role="dialog"
          >
            <button
              aria-label="Close archived habits"
              className="modal-close"
              onClick={() => setShowArchived(false)}
              type="button"
            >
              ×
            </button>
            <p className="section-label">YOUR ARCHIVE</p>
            <h2 id="archived-habits-title">Archived habits</h2>
            <p className="modal-intro">
              Restore a habit to return it to today’s list.
            </p>
            {archivedTasks.length === 0 ? (
              <p className="archived-empty">No archived habits.</p>
            ) : (
              <div className="archived-list">
                {archivedTasks.map((task) => (
                  <div className="archived-row" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.note || "No notes"}</span>
                    </div>
                    <button
                      className="list-toggle-button"
                      onClick={() => restoreTask(task)}
                      type="button"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
