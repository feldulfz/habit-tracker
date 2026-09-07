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
  const [actualMinutes, setActualMinutes] = useState(
    completion?.actual_minutes.toString() ?? "",
  );

  async function submitTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Math.round(Number(actualMinutes));
    if (minutes < 1 || minutes > 1440) return;
    if (await onSubmit(minutes)) onClose();
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
          <label htmlFor="actual-minutes">Actual time spent</label>
          <div className="duration-input duration-input-large">
            <input
              autoFocus
              id="actual-minutes"
              inputMode="numeric"
              max={1440}
              min={1}
              onChange={(event) => setActualMinutes(event.target.value)}
              placeholder={task.minimum_minutes?.toString() ?? "15"}
              required
              step={1}
              type="number"
              value={actualMinutes}
            />
            <span>minutes</span>
          </div>
          <p className="field-hint">
            A darker square means more time spent or more of your goal reached.
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
