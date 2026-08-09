import { ActivityCalendar, type Activity } from "react-activity-calendar";
import type { Task } from "../model/types";

type TaskDetailProps = {
  task: Task;
  activity: Activity[];
  completionCount: number;
};

export function TaskDetail({
  task,
  activity,
  completionCount,
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
        </div>
        <div className="detail-count">
          <strong>{completionCount}</strong>
          <span>days marked</span>
        </div>
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
  );
}
