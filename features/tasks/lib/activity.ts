import type { Activity } from "react-activity-calendar";
import type { Completion, Task } from "../model/types";
import { addDays, localDate } from "./dates";

export function durationLevel(completion: Completion, task?: Task) {
  const minutes = completion.actual_minutes;
  if (minutes <= 0) return 0;

  if (task?.minimum_minutes) {
    const ratio = minutes / task.minimum_minutes;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 1) return 3;
    return 4;
  }

  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export function isGoalMet(completion: Completion, task?: Task) {
  return task?.minimum_minutes
    ? completion.actual_minutes >= task.minimum_minutes
    : completion.actual_minutes > 0;
}

export function createActivity(
  completions: Completion[],
  tasks: Task[],
  taskId?: string,
): Activity[] {
  const start = addDays(new Date(), -364);
  const daily = new Map<string, { minutes: number; score: number }>();
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  completions.forEach((completion) => {
    if (!taskId || completion.task_id === taskId) {
      const current = daily.get(completion.completion_date) ?? {
        minutes: 0,
        score: 0,
      };
      current.minutes += completion.actual_minutes;
      current.score += durationLevel(
        completion,
        tasksById.get(completion.task_id),
      );
      daily.set(completion.completion_date, current);
    }
  });

  return Array.from({ length: 365 }, (_, index) => {
    const date = localDate(addDays(start, index));
    const value = daily.get(date);
    const count = value?.minutes ?? 0;
    const level = Math.min(4, value?.score ?? 0);

    return { date, count, level };
  });
}

export function currentStreak(completions: Completion[], tasks: Task[]) {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const activeDays = new Set(
    completions
      .filter((item) => isGoalMet(item, tasksById.get(item.task_id)))
      .map((item) => item.completion_date),
  );
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
