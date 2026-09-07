import { ActivityCalendar, type Activity } from "react-activity-calendar";
import type { Task } from "../model/types";

type TaskDetailProps = {
  task: Task;
  activity: Activity[];
  completionCount: number;
  totalMinutes: number;
  onEdit: () => void;
};

export function TaskDetail({
  task,
  activity,
  completionCount,
  totalMinutes,
  onEdit,
}: TaskDetailProps) {
  return (
    <section className="task-detail">
      <div className="detail-heading">
        <div>
          <p className="section-label">TASK HISTORY</p>
          <h2>{task.title}</h2>
          <p>
            {task.note ||
              "Every filled square is a day you kept this promise."}
          </p>
          <div className="detail-meta">
            <span>
              {task.minimum_minutes
                ? `${task.minimum_minutes} minute daily minimum`
                : "No daily minimum"}
            </span>
            <button className="edit-button" onClick={onEdit} type="button">
              Edit habit
            </button>
          </div>
        </div>
        <div className="detail-count">
          <strong>{totalMinutes}</strong>
          <span>minutes across {completionCount} logged days</span>
        </div>
      </div>
      <div className="legend" aria-label="Time intensity legend">
        <span>Less time</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i className={`legend-cell level-${level}`} key={level} />
        ))}
        <span>More time</span>
      </div>
      <div className="calendar-wrap compact-calendar">
        <ActivityCalendar
          blockMargin={4}
          blockRadius={3}
          blockSize={10}
          colorScheme="light"
          data={activity}
          fontSize={11}
          maxLevel={4}
          showColorLegend={false}
          showTotalCount={false}
          theme={{
            light: [
              "#e8e7df",
              "#c6e3bf",
              "#79b985",
              "#36805b",
              "#174c39",
            ],
          }}
          weekStart={1}
        />
      </div>
    </section>
  );
}
