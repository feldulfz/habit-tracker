"use client";

import { FormEvent, useState } from "react";
import type { Completion, Task } from "../model/types";

type LogTimeDialogProps = {
  task: Task;
  completion?: Completion;
  onClose: () => void;
  onRemove: () => Promise<boolean>;
  onSubmit: (actualMinutes: number) => Promise<boolean>;
};

export function LogTimeDialog({
  task,
  completion,
  onClose,
  onRemove,
  onSubmit,
}: LogTimeDialogProps) {
  const [hours, setHours] = useState(
    completion ? Math.floor(completion.actual_minutes / 60).toString() : "",
  );
  const [minutes, setMinutes] = useState(
    completion ? (completion.actual_minutes % 60).toString() : "",
  );

  async function submitTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const totalMinutes = Math.round(Number(hours || 0) * 60 + Number(minutes || 0));
    if (totalMinutes < 1 || totalMinutes > 1440) return;
    if (await onSubmit(totalMinutes)) onClose();
  }

  async function removeTime() {
    if (await onRemove()) onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="log-time-title"
        aria-modal="true"
        className="modal time-modal"
        role="dialog"
      >
        <button
          aria-label="Close time dialog"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="section-label">TODAY’S EFFORT</p>
        <h2 id="log-time-title">Log time for {task.title}</h2>
        <p className="modal-intro">
          {task.minimum_minutes
            ? `Your daily goal is ${task.minimum_minutes} minutes.`
            : "This habit has no minimum. Every minute still adds to its activity color."}
        </p>
        <form onSubmit={submitTime}>
          <label>Actual time spent</label>
          <div className="time-input-grid">
            <div>
              <label htmlFor="actual-hours">Hours</label>
              <div className="duration-input duration-input-large">
                <input
                  autoFocus
                  id="actual-hours"
                  inputMode="numeric"
                  max={24}
                  min={0}
                  onChange={(event) => setHours(event.target.value)}
                  placeholder={task.minimum_minutes
                    ? Math.floor(task.minimum_minutes / 60).toString()
                    : "0"}
                  step={1}
                  type="number"
                  value={hours}
                />
                <span>hours</span>
              </div>
            </div>
            <div>
              <label htmlFor="actual-minutes">Minutes</label>
              <div className="duration-input duration-input-large">
                <input
                  id="actual-minutes"
                  inputMode="numeric"
                  max={59}
                  min={0}
                  onChange={(event) => setMinutes(event.target.value)}
                  placeholder={task.minimum_minutes
                    ? (task.minimum_minutes % 60).toString()
                    : "15"}
                  step={1}
                  type="number"
                  value={minutes}
                />
                <span>minutes</span>
              </div>
            </div>
          </div>
          <p className="field-hint">
            Enter hours, minutes, or both. A darker square means more time spent.
          </p>
          <div className="modal-actions split-actions">
            <div>
              {completion && (
                <button
                  className="danger-button"
                  onClick={removeTime}
                  type="button"
                >
                  Remove today’s log
                </button>
              )}
            </div>
            <div className="action-group">
              <button className="cancel-button" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Save time
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
