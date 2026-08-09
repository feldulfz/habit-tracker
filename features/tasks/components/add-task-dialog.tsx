"use client";

import { FormEvent, useState } from "react";

type AddTaskDialogProps = {
  onClose: () => void;
  onSubmit: (title: string, note: string) => Promise<boolean>;
};

export function AddTaskDialog({ onClose, onSubmit }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSubmit(title, note)) onClose();
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
        aria-labelledby="add-task-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <button
          aria-label="Close add task dialog"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="section-label">A DAILY PROMISE</p>
        <h2 id="add-task-title">Add a task</h2>
        <p className="modal-intro">
          Keep it clear and repeatable. This task will appear every day.
        </p>
        <form onSubmit={submitTask}>
          <label htmlFor="task-title">Task name</label>
          <input
            autoFocus
            id="task-title"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Practice Spanish for 15 minutes"
            required
            value={title}
          />
          <label htmlFor="task-note">
            A short note <span>Optional</span>
          </label>
          <textarea
            id="task-note"
            maxLength={240}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why does this matter to you?"
            rows={3}
            value={note}
          />
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Add daily task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
