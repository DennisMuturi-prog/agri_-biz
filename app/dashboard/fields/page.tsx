import type { Metadata } from "next"
import { db } from "@/database"
import { field } from "@/db/field"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq, sql } from "drizzle-orm"
import { FieldTable } from "@/components/field-table"
import { fieldStage } from "@/db/field-stage"
import { note } from "@/db/note"
import { computeFieldStatus } from "@/lib/field-status"

export const metadata: Metadata = {
  title: "My Fields",
}

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  if (session.user.role == "admin") {
    redirect("/dashboard/fields-admin")
  }

  // ── Kick off independent queries in parallel ──────────────────────────

  const rawFieldsPromise = db
    .select({
      id: field.id,
      name: field.name,
      plantingDate: field.plantingDate,
      cropType: field.cropType,
      fieldStage: fieldStage.name,
      currentStageId: field.currentStageId,
    })
    .from(field)
    .where(eq(field.fieldAgentId, session.user.id))
    .innerJoin(fieldStage, eq(field.currentStageId, fieldStage.id))

  const stagesPromise = db
    .select({
      id: fieldStage.id,
      name: fieldStage.name,
    })
    .from(fieldStage)

  const [rawFields, stages] = await Promise.all([
    rawFieldsPromise,
    stagesPromise,
  ])

  // Fetch note counts and latest note timestamps per field
  const fieldIds = rawFields.map((f) => f.id)
  let noteAggs: {
    fieldId: number
    notesCount: number
    lastNoteCreatedAt: Date | null
  }[] = []
  if (fieldIds.length > 0) {
    noteAggs = await db
      .select({
        fieldId: note.fieldId,
        notesCount: sql<number>`count(*)`.as("notes_count"),
        lastNoteCreatedAt: sql<Date | null>`max(${note.createdAt})`.as(
          "last_note_at"
        ),
      })
      .from(note)
      .where(
        sql`${note.fieldId} IN (${sql.join(
          fieldIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .groupBy(note.fieldId)
  }

  // Build a lookup map: fieldId -> { notesCount, lastNoteCreatedAt }
  const noteMap = new Map<
    number,
    { notesCount: number; lastNoteCreatedAt: Date | null }
  >()
  for (const agg of noteAggs) {
    noteMap.set(agg.fieldId, {
      notesCount: agg.notesCount,
      lastNoteCreatedAt: agg.lastNoteCreatedAt,
    })
  }

  // Attach computed status to each field row
  const fields = rawFields.map((f) => {
    const agg = noteMap.get(f.id)
    const status = computeFieldStatus({
      currentStageId: f.currentStageId,
      plantingDate: f.plantingDate,
      notesCount: agg?.notesCount ?? 0,
      lastNoteCreatedAt: agg?.lastNoteCreatedAt ?? null,
    })
    return { ...f, status }
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold">My Fields</h1>
            <p className="text-sm text-muted-foreground">
              Fields assigned to you
            </p>
          </div>
          <FieldTable fields={fields} stages={stages} />
        </div>
      </div>
    </div>
  )
}
