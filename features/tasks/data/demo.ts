import type { Completion, Task } from "../model/types";
import { addDays, localDate } from "../lib/dates";

const DAY_MS = 86_400_000;

export const demoUser = "hello@daymark.app";

export const demoTasks: Task[] = [
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

export function makeDemoCompletions() {
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
