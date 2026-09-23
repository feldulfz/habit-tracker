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
    <Dialog
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
    >
      <DialogContent className="modal time-modal sm:max-w-[540px]">
        <DialogHeader className="gap-0">
          <p className="section-label">TODAY’S EFFORT</p>
          <DialogTitle>Log time for {task.title}</DialogTitle>
          <DialogDescription className="modal-intro">
            {task.minimum_minutes
              ? `Your daily goal is ${task.minimum_minutes} minutes.`
              : "This habit has no minimum. Every minute still adds to its activity color."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitTime}>
          <Label>Actual time spent</Label>
          <div className="time-input-grid">
            <div>
              <Label htmlFor="actual-hours">Hours</Label>
              <div className="duration-input duration-input-large">
                <Input
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
              <Label htmlFor="actual-minutes">Minutes</Label>
              <div className="duration-input duration-input-large">
                <Input
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
                <Button
                  className="danger-button"
                  onClick={removeTime}
                  type="button"
                  variant="destructive"
                >
                  Remove today’s log
                </Button>
              )}
            </div>
            <div className="action-group">
              <Button
                className="cancel-button"
                onClick={onClose}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button className="primary-button" type="submit">
                Save time
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
