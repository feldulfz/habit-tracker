import type { Activity } from "react-activity-calendar";
import type { Completion } from "../model/types";
import { addDays, localDate } from "./dates";

export function createActivity(
  completions: Completion[],
  taskId?: string,
): Activity[] {
  const start = addDays(new Date(), -364);
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

export function currentStreak(completions: Completion[]) {
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
