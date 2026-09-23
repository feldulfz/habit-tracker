"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <Dialog
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
    >
      <DialogContent className="modal sm:max-w-[500px]">
        <DialogHeader className="gap-0">
          <p className="section-label">A DAILY PROMISE</p>
          <DialogTitle>{editing ? "Edit habit" : "Add a habit"}</DialogTitle>
          <DialogDescription className="modal-intro">
            Set an optional daily time goal. You can still record partial effort.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitTask}>
          <Label htmlFor="task-title">Habit title</Label>
          <Input
            autoFocus
            id="task-title"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Practice Spanish"
            required
            value={title}
          />
          <Label htmlFor="task-note">
            Notes <span>Optional</span>
          </Label>
          <Textarea
            id="task-note"
            maxLength={240}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why does this matter to you?"
            rows={3}
            value={note}
          />
          <Label>
            Minimum time <span>Optional</span>
          </Label>
          <div className="time-input-grid">
            <div>
              <Label htmlFor="minimum-hours">Hours</Label>
              <div className="duration-input">
                <Input
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
              <Label htmlFor="minimum-minutes">Minutes</Label>
              <div className="duration-input">
                <Input
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
            <Button
              className="cancel-button"
              onClick={onClose}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button className="primary-button" type="submit">
              {editing ? "Save changes" : "Add daily habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
