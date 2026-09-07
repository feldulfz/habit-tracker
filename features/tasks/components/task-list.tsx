import { isGoalMet } from "../lib/activity";
import type { Completion, Task } from "../model/types";

type TaskListProps = {
  tasks: Task[];
  todayCompletions: Map<string, Completion>;
  selectedTaskId: string | null;
  loading: boolean;
  onAddTask: () => void;
  onArchiveTask: (task: Task) => void;
  onSelectTask: (taskId: string) => void;
  onLogTime: (task: Task) => void;
};

export function TaskList({
  tasks,
  todayCompletions,
  selectedTaskId,
  loading,
  onAddTask,
  onArchiveTask,
  onSelectTask,
  onLogTime,
}: TaskListProps) {
  const completedCount = tasks.filter((task) => {
    const completion = todayCompletions.get(task.id);
    return completion ? isGoalMet(completion, task) : false;
  }).length;

  return (
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
          <h2>Today’s habits</h2>
        </div>
        <span className="today-progress">
          {completedCount} of {tasks.length} goals met
        </span>
      </div>

      {loading ? (
        <div className="task-empty">Loading your habits…</div>
      ) : tasks.length === 0 ? (
        <div className="task-empty">
          <span className="empty-mark">✓</span>
          <h3>Your list is clear.</h3>
          <p>Add one small thing you want to return to each day.</p>
          <button className="secondary-button" onClick={onAddTask} type="button">
            Add your first habit
          </button>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => {
            const completion = todayCompletions.get(task.id);
            const done = completion ? isGoalMet(completion, task) : false;
            const partial = Boolean(completion && !done);
            const selected = selectedTaskId === task.id;
            const status = completion
              ? task.minimum_minutes
                ? `${completion.actual_minutes} / ${task.minimum_minutes} min`
                : `${completion.actual_minutes} min logged`
              : task.minimum_minutes
                ? `${task.minimum_minutes} min goal`
                : "No minimum";

            return (
              <div
                className={`task-row ${done ? "task-done" : ""} ${partial ? "task-partial" : ""} ${selected ? "task-selected" : ""}`}
                key={task.id}
              >
                <button
                  aria-label={`Log time for ${task.title}`}
                  aria-pressed={done}
                  className="check-button"
                  onClick={() => onLogTime(task)}
                  type="button"
                >
                  <span aria-hidden="true">{done ? "✓" : partial ? "·" : ""}</span>
                </button>
                <button
                  className="task-copy"
                  onClick={() => onSelectTask(task.id)}
                  type="button"
                >
                  <strong>{task.title}</strong>
                  <span>{task.note || "Click to see this habit’s history"}</span>
                </button>
                <button
                  className="task-status"
                  onClick={() => onLogTime(task)}
                  type="button"
                >
                  {status}
                </button>
                <button
                  aria-label={`Archive ${task.title}`}
                  className="more-button"
                  onClick={() => onArchiveTask(task)}
                  title="Archive habit"
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
  );
}
