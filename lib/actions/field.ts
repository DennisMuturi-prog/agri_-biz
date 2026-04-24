"use server"

import { z } from "zod"
import { db } from "@/database"
import { field } from "@/db/field"
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
// Server Action
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
