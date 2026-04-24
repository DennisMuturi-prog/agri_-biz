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
import { Pencil } from "lucide-react"
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
import { updateFieldAgent, type UpdateAgentResult } from "@/lib/actions/field"
import { useRouter } from "next/navigation"
import type { FieldStatus } from "@/lib/field-status"
import { Badge } from "@/components/ui/badge"

function formatTimestampToDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

type Field = {
  id: number
  name: string
  cropType: string
  plantingDate: Date
  fieldStage: string
  currentStageId: number
  fieldAgentName: string | null
  fieldAgentEmail: string | null
  fieldAgentId: string | null
  status: FieldStatus
}

type Agent = {
  id: string
  name: string
  email: string
}

type FieldTableBlockProps = {
  fields: Field[]
  agents: Agent[]
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

export function FieldAdminTable({ fields, agents }: FieldTableBlockProps) {
  const router = useRouter()
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>("__unassign__")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleEditClick(field: Field) {
    setSelectedField(field)
    setSelectedAgentId(field.fieldAgentId || "__unassign__")
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!selectedField) return

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("fieldId", selectedField.id.toString())
    formData.append(
      "agentId",
      selectedAgentId === "__unassign__" ? "" : selectedAgentId
    )

    const result: UpdateAgentResult = await updateFieldAgent(formData)

    if (result.success) {
      setDialogOpen(false)
      router.refresh()
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <>
      <Table>
        <TableCaption>A list of all fields</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">Name</TableHead>
            <TableHead>Crop type</TableHead>
            <TableHead>Planting date</TableHead>
            <TableHead>Field status</TableHead>
            <TableHead>Agent assigned</TableHead>
            <TableHead>Agent email</TableHead>
            <TableHead className="text-right">Field stage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">{field.name}</TableCell>
              <TableCell>{field.cropType}</TableCell>
              <TableCell>{formatTimestampToDate(field.plantingDate)}</TableCell>
              <TableCell>
                <StatusBadge status={field.status} />
              </TableCell>
              <TableCell>
                {field.fieldAgentName ?? (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell>
                {field.fieldAgentEmail ?? (
                  <span className="text-muted-foreground italic">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">{field.fieldStage}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleEditClick(field)}
                >
                  <Pencil />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign field agent</DialogTitle>
            <DialogDescription>
              Change the agent assigned to{" "}
              <strong>{selectedField?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedField && (
            <div className="py-2">
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassign__">Unassign</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
