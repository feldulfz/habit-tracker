"use client";

import { FormEvent, useState } from "react";
import type { Task, TaskValues } from "../model/types";

type TaskFormDialogProps = {
  task?: Task;
  onClose: () => void;
  onSubmit: (values: TaskValues) => Promise<boolean>;
};

export function TaskFormDialog({
  task,
  onClose,
  onSubmit,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [note, setNote] = useState(task?.note ?? "");
  const [minimumHours, setMinimumHours] = useState(
    task?.minimum_minutes
      ? Math.floor(task.minimum_minutes / 60).toString()
      : "",
  );
  const [minimumMinutes, setMinimumMinutes] = useState(
    task?.minimum_minutes ? (task.minimum_minutes % 60).toString() : "",
  );

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasMinimum = minimumHours !== "" || minimumMinutes !== "";
    const minimum = hasMinimum
      ? Math.round(Number(minimumHours || 0) * 60 + Number(minimumMinutes || 0))
      : null;
    if (minimum !== null && (minimum < 1 || minimum > 1440)) return;
    if (await onSubmit({ title, note, minimumMinutes: minimum })) onClose();
  }

  const editing = Boolean(task);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <button
          aria-label="Close task dialog"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="section-label">A DAILY PROMISE</p>
        <h2 id="task-form-title">{editing ? "Edit habit" : "Add a habit"}</h2>
        <p className="modal-intro">
          Set an optional daily time goal. You can still record partial effort.
        </p>
        <form onSubmit={submitTask}>
          <label htmlFor="task-title">Habit title</label>
          <input
            autoFocus
            id="task-title"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Practice Spanish"
            required
            value={title}
          />
          <label htmlFor="task-note">
            Notes <span>Optional</span>
          </label>
          <textarea
            id="task-note"
            maxLength={240}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why does this matter to you?"
            rows={3}
            value={note}
          />
          <label>
            Minimum time <span>Optional</span>
          </label>
          <div className="time-input-grid">
            <div>
              <label htmlFor="minimum-hours">Hours</label>
              <div className="duration-input">
                <input
                  id="minimum-hours"
                  inputMode="numeric"
                  max={24}
                  min={0}
                  onChange={(event) => setMinimumHours(event.target.value)}
                  placeholder="0"
                  step={1}
                  type="number"
                  value={minimumHours}
                />
                <span>hours</span>
              </div>
            </div>
            <div>
              <label htmlFor="minimum-minutes">Minutes</label>
              <div className="duration-input">
                <input
                  id="minimum-minutes"
                  inputMode="numeric"
                  max={59}
                  min={0}
                  onChange={(event) => setMinimumMinutes(event.target.value)}
                  placeholder="30"
                  step={1}
                  type="number"
                  value={minimumMinutes}
                />
                <span>minutes</span>
              </div>
            </div>
          </div>
          <p className="field-hint">
            Leave this empty for a habit without a minimum time goal.
          </p>
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" type="submit">
              {editing ? "Save changes" : "Add daily habit"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
