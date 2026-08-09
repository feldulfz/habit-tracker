import type { Task } from "../model/types";

type TaskListProps = {
  tasks: Task[];
  completedToday: Set<string>;
  selectedTaskId: string | null;
  loading: boolean;
  onAddTask: () => void;
  onArchiveTask: (task: Task) => void;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (task: Task) => void;
};

export function TaskList({
  tasks,
  completedToday,
  selectedTaskId,
  loading,
  onAddTask,
  onArchiveTask,
  onSelectTask,
  onToggleTask,
}: TaskListProps) {
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
          <button className="secondary-button" onClick={onAddTask} type="button">
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
                  onClick={() => onToggleTask(task)}
                  type="button"
                >
                  <span aria-hidden="true">{done ? "✓" : ""}</span>
                </button>
                <button
                  className="task-copy"
                  onClick={() => onSelectTask(task.id)}
                  type="button"
                >
                  <strong>{task.title}</strong>
                  <span>{task.note || "Click to see this task’s history"}</span>
                </button>
                <span className="task-status">
                  {done ? "Marked today" : "Not yet"}
                </span>
                <button
                  aria-label={`Archive ${task.title}`}
                  className="more-button"
                  onClick={() => onArchiveTask(task)}
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
  );
}
