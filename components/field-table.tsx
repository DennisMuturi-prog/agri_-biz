"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, StickyNote } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  updateFieldStage,
  addNote,
  getFieldNotes,
  type UpdateStageResult,
  type AddNoteResult,
  type GetNotesResult,
  type NoteItem,
} from "@/lib/actions/field"
import { useRouter } from "next/navigation"

import type { FieldStatus } from "@/lib/field-status"
import { Badge } from "@/components/ui/badge"

function formatTimestampToDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTimestampForNote(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

type Field = {
  id: number
  name: string
  cropType: string
  plantingDate: Date
  fieldStage: string
  currentStageId: number
  status: FieldStatus
}

type Stage = {
  id: number
  name: string
}

type FieldTableBlockProps = {
  fields: Field[]
  stages: Stage[]
}

function StatusBadge({ status }: { status: FieldStatus }) {
  const variant =
    status === "Completed"
      ? "default"
      : status === "At Risk"
        ? "destructive"
        : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

export function FieldTable({ fields, stages }: FieldTableBlockProps) {
  const router = useRouter()

  // -- Stage advance dialog state --
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string>("")
  const [isSubmittingStage, setIsSubmittingStage] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)

  // -- Add note dialog state --
  const [noteField, setNoteField] = useState<Field | null>(null)
  const [observation, setObservation] = useState("")
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)

  // -- View notes dialog state --
  const [viewNotesField, setViewNotesField] = useState<Field | null>(null)
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [viewNotesError, setViewNotesError] = useState<string | null>(null)
  const [viewNotesDialogOpen, setViewNotesDialogOpen] = useState(false)

  function getNextStage(currentStageId: number): Stage | undefined {
    const currentIndex = stages.findIndex((s) => s.id === currentStageId)
    if (currentIndex === -1 || currentIndex >= stages.length - 1)
      return undefined
    return stages[currentIndex + 1]
  }

  // ---- Stage advance handlers ----

  function handleEditClick(field: Field) {
    setSelectedField(field)
    const next = getNextStage(field.currentStageId)
    setSelectedStageId(next ? next.id.toString() : "")
    setStageError(null)
    setStageDialogOpen(true)
  }

  async function handleStageSave() {
    if (!selectedField || !selectedStageId) return

    setIsSubmittingStage(true)
    setStageError(null)

    const formData = new FormData()
    formData.append("fieldId", selectedField.id.toString())
    formData.append("stageId", selectedStageId)

    const result: UpdateStageResult = await updateFieldStage(formData)

    if (result.success) {
      setStageDialogOpen(false)
      router.refresh()
    } else {
      setStageError(result.error)
    }

    setIsSubmittingStage(false)
  }

  // ---- Add note handlers ----

  function handleNoteClick(field: Field) {
    setNoteField(field)
    setObservation("")
    setNoteError(null)
    setNoteDialogOpen(true)
  }

  async function handleNoteSave() {
    if (!noteField) return

    setIsSubmittingNote(true)
    setNoteError(null)

    const formData = new FormData()
    formData.append("fieldId", noteField.id.toString())
    formData.append("observation", observation)

    const result: AddNoteResult = await addNote(formData)

    if (result.success) {
      setNoteDialogOpen(false)
      router.refresh()
    } else {
      setNoteError(result.error)
    }

    setIsSubmittingNote(false)
  }

  // ---- View notes handlers ----

  async function handleViewNotesClick(field: Field) {
    setViewNotesField(field)
    setViewNotesError(null)
    setViewNotesDialogOpen(true)

    setIsLoadingNotes(true)
    const result: GetNotesResult = await getFieldNotes(field.id)
    setIsLoadingNotes(false)

    if (result.success) {
      setNotes(result.notes)
    } else {
      setViewNotesError(result.error)
      setNotes([])
    }
  }

  return (
    <>
      <Table>
        <TableCaption>A list of your fields</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">Name</TableHead>
            <TableHead>Crop type</TableHead>
            <TableHead>Planting date</TableHead>
            <TableHead>Field status</TableHead>
            <TableHead>Field stage</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => {
            const next = getNextStage(field.currentStageId)
            return (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.name}</TableCell>
                <TableCell>{field.cropType}</TableCell>
                <TableCell>
                  {formatTimestampToDate(field.plantingDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={field.status} />
                </TableCell>
                <TableCell>{field.fieldStage}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewNotesClick(field)}
                      title={`View notes for ${field.name}`}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">
                        View notes for {field.name}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleNoteClick(field)}
                      title={`Add note for ${field.name}`}
                    >
                      <StickyNote className="size-4" />
                      <span className="sr-only">Add note for {field.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(field)}
                      disabled={!next}
                      title={
                        next
                          ? `Advance to "${next.name}"`
                          : "Already in final stage"
                      }
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {field.name}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* ---- Stage advance dialog ---- */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update field stage</DialogTitle>
            <DialogDescription>
              Advance the growth stage for{" "}
              <strong>{selectedField?.name}</strong>
              {selectedField &&
                (() => {
                  const next = getNextStage(selectedField.currentStageId)
                  return next
                    ? ` from "${selectedField.fieldStage}" to "${next.name}".`
                    : " is already at its final stage."
                })()}
            </DialogDescription>
          </DialogHeader>

          {selectedField &&
            (() => {
              const next = getNextStage(selectedField.currentStageId)
              if (!next) {
                return (
                  <p className="py-4 text-center text-muted-foreground">
                    This field has already reached the final stage (Harvested).
                  </p>
                )
              }
              return (
                <div className="py-2">
                  <Select
                    value={selectedStageId}
                    onValueChange={setSelectedStageId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select next stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={next.id.toString()}>
                        {next.name}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {stageError && (
                    <p className="mt-2 text-sm text-destructive">
                      {stageError}
                    </p>
                  )}
                </div>
              )
            })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStageDialogOpen(false)}
              disabled={isSubmittingStage}
            >
              Cancel
            </Button>
            {selectedField && getNextStage(selectedField.currentStageId) && (
              <Button onClick={handleStageSave} disabled={isSubmittingStage}>
                {isSubmittingStage ? "Advancing..." : "Advance to next stage"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Add note dialog ---- */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add observation note</DialogTitle>
            <DialogDescription>
              Record an observation for <strong>{noteField?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Enter your observation..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={4}
            />
            {noteError && (
              <p className="mt-2 text-sm text-destructive">{noteError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNoteDialogOpen(false)}
              disabled={isSubmittingNote}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNoteSave}
              disabled={isSubmittingNote || observation.trim().length === 0}
            >
              {isSubmittingNote ? "Saving..." : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- View notes dialog ---- */}
      <Dialog open={viewNotesDialogOpen} onOpenChange={setViewNotesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notes for {viewNotesField?.name}</DialogTitle>
            <DialogDescription>
              All observations recorded for this field.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto py-2">
            {isLoadingNotes && (
              <p className="py-8 text-center text-muted-foreground">
                Loading notes...
              </p>
            )}

            {viewNotesError && (
              <p className="py-4 text-center text-destructive">
                {viewNotesError}
              </p>
            )}

            {!isLoadingNotes && !viewNotesError && notes.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No notes have been recorded for this field yet.
              </p>
            )}

            {!isLoadingNotes &&
              notes.map((note) => (
                <div
                  key={note.id}
                  className="mb-3 rounded-lg border bg-muted/30 p-3 last:mb-0"
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {note.observation}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatTimestampForNote(note.createdAt)}
                  </p>
                </div>
              ))}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  )
}
