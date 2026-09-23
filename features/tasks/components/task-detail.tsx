import { useState } from "react";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HabitNote, Task } from "../model/types";

type TaskDetailProps = {
  task: Task;
  activity: Activity[];
  completionCount: number;
  totalMinutes: number;
  onEdit: () => void;
  notes: HabitNote[];
  onAddNote: (body: string) => Promise<boolean>;
  onUpdateNote: (note: HabitNote, body: string) => Promise<boolean>;
  onDeleteNote: (note: HabitNote) => Promise<boolean>;
};

export function TaskDetail({
  task,
  activity,
  completionCount,
  totalMinutes,
  onEdit,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: TaskDetailProps) {
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onAddNote(newNote)) closeAddNote();
  }

  function closeAddNote() {
    setShowAddNote(false);
    setNewNote("");
  }

  async function updateNote(note: HabitNote) {
    if (await onUpdateNote(note, editingBody)) {
      setEditingNoteId(null);
      setEditingBody("");
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <section className="task-detail">
      <div className="detail-heading">
        <div>
          <p className="section-label">TASK HISTORY</p>
          <h2>{task.title}</h2>
          <p>
            {task.note ||
              "Every filled square is a day you kept this promise."}
          </p>
          <div className="detail-meta">
            <span>
              {task.minimum_minutes
                ? `${task.minimum_minutes} minute daily minimum`
                : "No daily minimum"}
            </span>
            <Button
              className="edit-button"
              onClick={onEdit}
              type="button"
              variant="outline"
            >
              Edit habit
            </Button>
          </div>
        </div>
        <div className="detail-count">
          <strong>{totalMinutes}</strong>
          <span>minutes across {completionCount} logged days</span>
        </div>
      </div>
      <div className="legend" aria-label="Time intensity legend">
        <span>Less time</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i className={`legend-cell level-${level}`} key={level} />
        ))}
        <span>More time</span>
      </div>
      <div className="calendar-wrap compact-calendar">
        <ActivityCalendar
          blockMargin={4}
          blockRadius={3}
          blockSize={10}
          colorScheme="light"
          data={activity}
          fontSize={11}
          maxLevel={4}
          showColorLegend={false}
          showTotalCount={false}
          theme={{
            light: [
              "#ebedf0",
              "#9be9a8",
              "#40c463",
              "#30a14e",
              "#216e39",
            ],
          }}
          weekStart={1}
        />
      </div>
      <section className="habit-notes" aria-labelledby="habit-notes-title">
        <div className="notes-heading">
          <div>
            <p className="section-label">REFLECTIONS</p>
            <h3 id="habit-notes-title">Improvement notes</h3>
          </div>
          <div className="notes-heading-actions">
            <span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
            <Dialog
              onOpenChange={(open) => {
                if (open) setShowAddNote(true);
                else closeAddNote();
              }}
              open={showAddNote}
            >
              <DialogTrigger
                render={
                  <Button className="primary-button note-save-button" />
                }
              >
                ＋ Add note
              </DialogTrigger>
              <DialogContent className="modal note-modal sm:max-w-[560px]">
                <DialogHeader className="gap-0">
                  <p className="section-label">REFLECTION</p>
                  <DialogTitle className="text-2xl">
                    Add an improvement note
                  </DialogTitle>
                  <DialogDescription className="modal-intro">
                    Capture what could make this habit easier or better next time.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addNote}>
                  <Label htmlFor={`new-note-${task.id}`}>Note</Label>
                  <Textarea
                    autoFocus
                    id={`new-note-${task.id}`}
                    maxLength={2000}
                    onChange={(event) => setNewNote(event.target.value)}
                    placeholder="Write your reflection…"
                    required
                    rows={5}
                    value={newNote}
                  />
                  <p className="note-character-count">{newNote.length}/2000</p>
                  <div className="modal-actions">
                    <Button
                      className="cancel-button"
                      onClick={closeAddNote}
                      type="button"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button className="primary-button" type="submit">
                      Add note
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="notes-list">
          {notes.length === 0 ? (
            <p className="notes-empty">
              No notes yet. Capture what you want to improve next time.
            </p>
          ) : (
            notes.map((note) => (
              <article className="note-item" key={note.id}>
                {editingNoteId === note.id ? (
                  <>
                    <Textarea
                      aria-label="Edit note"
                      maxLength={2000}
                      onChange={(event) => setEditingBody(event.target.value)}
                      rows={3}
                      value={editingBody}
                    />
                    <div className="note-edit-actions">
                      <Button
                        className="text-button"
                        onClick={() => setEditingNoteId(null)}
                        type="button"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="edit-button"
                        disabled={!editingBody.trim()}
                        onClick={() => updateNote(note)}
                        type="button"
                        variant="outline"
                      >
                        Save changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <p>{note.body}</p>
                )}
                <div className="note-footer">
                  <div>
                    <span>
                      Created <time dateTime={note.created_at}>{formatDate(note.created_at)}</time>
                    </span>
                    <span>
                      Last edited <time dateTime={note.updated_at}>{formatDate(note.updated_at)}</time>
                    </span>
                  </div>
                  {editingNoteId !== note.id && (
                    <div className="note-actions">
                      <Button
                        className="text-button"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingBody(note.body);
                        }}
                        type="button"
                        variant="ghost"
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              className="delete-note-button"
                              variant="destructive"
                            />
                          }
                        >
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent className="modal">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the reflection from this habit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="modal-actions">
                            <AlertDialogCancel
                              className="cancel-button"
                              variant="ghost"
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="delete-confirm-button"
                              onClick={() => onDeleteNote(note)}
                              variant="destructive"
                            >
                              Delete note
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
