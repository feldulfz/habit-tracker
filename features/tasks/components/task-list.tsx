"use client";

import { type ReactNode, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSwappingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isGoalMet } from "../lib/activity";
import type { Completion, Task } from "../model/types";

type TaskListProps = {
  tasks: Task[];
  todayCompletions: Map<string, Completion>;
  selectedTaskId: string | null;
  loading: boolean;
  onAddTask: () => void;
  onArchiveTask: (task: Task) => void;
  onReorderTasks: (firstTaskId: string, secondTaskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onLogTime: (task: Task) => void;
};

type HabitFilter = "incomplete" | "completed" | "all";

function SortableTaskRow({
  children,
  className,
  task,
}: {
  children: ReactNode;
  className: string;
  task: Task;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });
  const { onKeyDown, ...rowListeners } = listeners ?? {};

  return (
    <div
      className={`${className} ${isDragging ? "task-dragging" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...rowListeners}
    >
      <Button
        aria-label={`Reorder ${task.title}`}
        className="drag-handle"
        size="icon-sm"
        title="Drag to reorder. Press Space, then use the arrow keys, to reorder with a keyboard."
        type="button"
        variant="ghost"
        {...attributes}
        onKeyDown={onKeyDown}
      >
        <GripVertical />
      </Button>
      {children}
    </div>
  );
}

export function TaskList({
  tasks,
  todayCompletions,
  selectedTaskId,
  loading,
  onAddTask,
  onArchiveTask,
  onReorderTasks,
  onSelectTask,
  onLogTime,
}: TaskListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HabitFilter>("incomplete");
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const isDone = (task: Task) => {
    const completion = todayCompletions.get(task.id);
    return completion ? isGoalMet(completion, task) : false;
  };
  const completedCount = tasks.filter(isDone).length;
  const normalizedQuery = tasks.length >= 6 ? query.trim().toLowerCase() : "";
  const matchesQuery = (task: Task) =>
    !normalizedQuery ||
    `${task.title} ${task.note ?? ""}`.toLowerCase().includes(normalizedQuery);
  const matchesFilter = (task: Task) =>
    filter === "all" ||
    (filter === "completed" ? isDone(task) : !isDone(task));
  const filteredTasks = tasks.filter(
    (task) => matchesFilter(task) && matchesQuery(task),
  );
  const visibleTasks = filteredTasks;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onReorderTasks(String(active.id), String(over.id));
    }
  };

  const renderTask = (task: Task) => {
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
      <SortableTaskRow
        className={`task-row ${done ? "task-done" : ""} ${partial ? "task-partial" : ""} ${selected ? "task-selected" : ""}`}
        key={task.id}
        task={task}
      >
        <Button
          aria-label={`Log time for ${task.title}`}
          aria-pressed={done}
          className="check-button"
          onClick={() => onLogTime(task)}
          type="button"
          variant="ghost"
        >
          <span aria-hidden="true">{done ? "✓" : partial ? "·" : ""}</span>
        </Button>
        <Button
          className="task-copy"
          onClick={() => onSelectTask(task.id)}
          type="button"
          variant="ghost"
        >
          <strong>{task.title}</strong>
          <span>{task.note || "Click to see this habit’s history"}</span>
        </Button>
        <Button
          className="task-status"
          onClick={() => onLogTime(task)}
          type="button"
          variant="ghost"
        >
          {status}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                aria-label={`Archive ${task.title}`}
                className="more-button"
                title="Archive habit"
                variant="ghost"
              />
            }
          >
            ···
          </AlertDialogTrigger>
          <AlertDialogContent className="modal">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive {task.title}?</AlertDialogTitle>
              <AlertDialogDescription>
                This habit will leave today’s list. You can restore it from the account menu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="modal-actions">
              <AlertDialogCancel className="cancel-button" variant="ghost">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="primary-button"
                onClick={() => onArchiveTask(task)}
              >
                Archive habit
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SortableTaskRow>
    );
  };

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
          <Button className="secondary-button" onClick={onAddTask} type="button">
            Add your first habit
          </Button>
        </div>
      ) : (
        <>
          <div
            className={`task-list-tools ${tasks.length < 6 ? "filter-only" : ""}`}
          >
            {tasks.length >= 6 && (
              <>
                <Label className="sr-only" htmlFor="habit-search">
                  Search habits
                </Label>
                <Input
                  id="habit-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search habits"
                  type="search"
                  value={query}
                />
              </>
            )}
            <Label className="sr-only" htmlFor="habit-filter">
              Filter habits
            </Label>
            <Select
              onValueChange={(value) => {
                setFilter(value as HabitFilter);
              }}
              value={filter}
            >
              <SelectTrigger
                aria-label="Filter habits"
                className="habit-filter-trigger"
                id="habit-filter"
              >
                <SelectValue>
                  {filter === "incomplete"
                    ? "Not completed"
                    : filter === "completed"
                      ? "Completed"
                      : "All habits"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="incomplete">Not completed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All habits</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="task-list-body">
            {visibleTasks.length > 0 && (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={visibleTasks.map((task) => task.id)}
                  strategy={rectSwappingStrategy}
                >
                  <div className="task-list">{visibleTasks.map(renderTask)}</div>
                </SortableContext>
              </DndContext>
            )}

            {filteredTasks.length === 0 && (
              <div className="search-empty">
                {normalizedQuery
                  ? `No habits match “${query}”.`
                  : filter === "completed"
                    ? "No completed habits today."
                    : filter === "incomplete"
                      ? "All habits are completed."
                      : "No habits to show."}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
