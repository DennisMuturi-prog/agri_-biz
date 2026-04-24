"use server"

import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { db } from "@/database"
import { field } from "@/db/field"
import { note } from "@/db/note"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

// ---------------------------------------------------------------------------
// Validation schema – mirrors the client-side schema
// ---------------------------------------------------------------------------
const createFieldSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters").trim(),
  cropType: z.string().min(1, "Crop type is required").trim(),
  /** plantingDate stored as epoch ms (number) */
  plantingDate: z
    .number({ message: "Planting date must be a valid date" })
    .int("Planting date must be a valid date")
    .min(1, "Planting date is required"),
  /** currentStageId – number that references field_stage.id */
  currentStageId: z
    .number({ message: "Stage must be a number" })
    .int()
    .min(1, "Stage is required"),
  /** fieldAgentId – optional text that references user.id */
  fieldAgentId: z.string().optional().default(""),
})

// ---------------------------------------------------------------------------
// Result type returned to the client
// ---------------------------------------------------------------------------
export type CreateFieldResult =
  | { success: true; field: { id: number } }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Server Action – Create Field
// ---------------------------------------------------------------------------
export async function createField(
  formData: z.infer<typeof createFieldSchema>
): Promise<CreateFieldResult> {
  try {
    // 1. Validate the input
    const parsed = createFieldSchema.safeParse(formData)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input"
      return { success: false, error: firstError }
    }

    const { name, cropType, plantingDate, currentStageId, fieldAgentId } =
      parsed.data

    // 2. Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to create a field",
      }
    }

    // 3. Check admin role (null roles are not admin)
    if (session.user.role !== "admin") {
      return {
        success: false,
        error: "Only admins can create fields",
      }
    }

    // 4. Insert into the database
    const [inserted] = await db
      .insert(field)
      .values({
        name,
        cropType,
        plantingDate: new Date(plantingDate),
        currentStageId,
        fieldAgentId: fieldAgentId || null,
      })
      .returning({ id: field.id })

    // 5. Revalidate the dashboard or fields list
    revalidatePath("/dashboard")

    return { success: true, field: { id: inserted.id } }
  } catch (err) {
    console.error("createField error:", err)
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    }
  }
}

// ---------------------------------------------------------------------------
// Update Field Stage result type
// ---------------------------------------------------------------------------
export type UpdateStageResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Server Action – Update Field Stage
// ---------------------------------------------------------------------------
export async function updateFieldStage(
  formData: FormData
): Promise<UpdateStageResult> {
  try {
    const fieldId = Number(formData.get("fieldId"))
    const newStageId = Number(formData.get("stageId"))

    if (!fieldId || !newStageId) {
      return { success: false, error: "Missing fieldId or stageId" }
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return { success: false, error: "You must be logged in" }
    }

    // Fetch the current field to get its current stage
    const [currentField] = await db
      .select({ currentStageId: field.currentStageId })
      .from(field)
      .where(eq(field.id, fieldId))
      .limit(1)

    if (!currentField) {
      return { success: false, error: "Field not found" }
    }

    // Field agents can only update fields they are assigned to
    if (session.user.role !== "admin") {
      const [assignedCheck] = await db
        .select({ id: field.id, agentId: field.fieldAgentId })
        .from(field)
        .where(eq(field.id, fieldId))
        .limit(1)

      if (!assignedCheck || assignedCheck.agentId !== session.user.id) {
        return {
          success: false,
          error: "You can only update fields assigned to you",
        }
      }
    }

    // Enforce sequential progression: can only move to the next stage
    const currentStageId = currentField.currentStageId
    if (newStageId !== currentStageId + 1) {
      return {
        success: false,
        error:
          "Stages must progress sequentially. You can only advance to the next stage.",
      }
    }

    await db
      .update(field)
      .set({ currentStageId: newStageId })
      .where(eq(field.id, fieldId))

    revalidatePath("/dashboard/fields")
    revalidatePath("/dashboard/fields-admin")

    return { success: true }
  } catch (err) {
    console.error("updateFieldStage error:", err)
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    }
  }
}

// ---------------------------------------------------------------------------
// Update Field Agent result type
// ---------------------------------------------------------------------------
export type UpdateAgentResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Server Action – Update Field Agent (admin only)
// ---------------------------------------------------------------------------
export async function updateFieldAgent(
  formData: FormData
): Promise<UpdateAgentResult> {
  try {
    const fieldId = Number(formData.get("fieldId"))
    const agentId = formData.get("agentId") as string | null

    if (!fieldId) {
      return { success: false, error: "Missing fieldId" }
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return { success: false, error: "You must be logged in" }
    }

    if (session.user.role !== "admin") {
      return { success: false, error: "Only admins can reassign field agents" }
    }

    await db
      .update(field)
      .set({ fieldAgentId: agentId || null })
      .where(eq(field.id, fieldId))

    revalidatePath("/dashboard/fields-admin")
    revalidatePath("/dashboard/fields")

    return { success: true }
  } catch (err) {
    console.error("updateFieldAgent error:", err)
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    }
  }
}

// ---------------------------------------------------------------------------
// Add Note result type
// ---------------------------------------------------------------------------
export type AddNoteResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Server Action – Add Note to a Field
// ---------------------------------------------------------------------------
export async function addNote(formData: FormData): Promise<AddNoteResult> {
  try {
    const fieldId = Number(formData.get("fieldId"))
    const observation = formData.get("observation") as string | null

    if (!fieldId) {
      return { success: false, error: "Missing fieldId" }
    }

    if (!observation || observation.trim().length === 0) {
      return { success: false, error: "Observation cannot be empty" }
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return { success: false, error: "You must be logged in" }
    }

    // Field agents can only add notes to fields they are assigned to
    if (session.user.role !== "admin") {
      const [assignedCheck] = await db
        .select({ agentId: field.fieldAgentId })
        .from(field)
        .where(eq(field.id, fieldId))
        .limit(1)

      if (!assignedCheck || assignedCheck.agentId !== session.user.id) {
        return {
          success: false,
          error: "You can only add notes to fields assigned to you",
        }
      }
    }

    await db.insert(note).values({
      fieldId,
      observation: observation.trim(),
    })

    revalidatePath("/dashboard/fields")
    revalidatePath("/dashboard/fields-admin")

    return { success: true }
  } catch (err) {
    console.error("addNote error:", err)
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    }
  }
}

// ---------------------------------------------------------------------------
// Get Field Notes result type
// ---------------------------------------------------------------------------
export type NoteItem = {
  id: number
  observation: string
  createdAt: Date
}

export type GetNotesResult =
  | { success: true; notes: NoteItem[] }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Server Action – Get Notes for a Field
// ---------------------------------------------------------------------------
export async function getFieldNotes(fieldId: number): Promise<GetNotesResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return { success: false, error: "You must be logged in" }
    }

    const notes = await db
      .select({
        id: note.id,
        observation: note.observation,
        createdAt: note.createdAt,
      })
      .from(note)
      .where(eq(note.fieldId, fieldId))
      .orderBy(desc(note.createdAt))

    return { success: true, notes }
  } catch (err) {
    console.error("getFieldNotes error:", err)
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    }
  }
}
