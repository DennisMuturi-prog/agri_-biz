import type { Metadata } from "next"
import { db } from "@/database"
import { field } from "@/db/field"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq, sql } from "drizzle-orm"
import { fieldStage } from "@/db/field-stage"
import Link from "next/link"
import { FieldAdminTable } from "@/components/field-table-admin"
import { user } from "@/db/auth-schema"
import { note } from "@/db/note"
import { computeFieldStatus } from "@/lib/field-status"

export const metadata: Metadata = {
  title: "All Fields",
}

type Agent = {
  id: string
  name: string
  email: string
}

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  if (session.user.role != "admin") {
    return (
      <div>
        This is an admin page go to fields agent page{" "}
        <Link href="/dashboard/fields">fields</Link>
      </div>
    )
  }

  const rawFieldsPromise = db
    .select({
      id: field.id,
      name: field.name,
      plantingDate: field.plantingDate,
      cropType: field.cropType,
      fieldStage: fieldStage.name,
      currentStageId: field.currentStageId,
      fieldAgentName: user.name,
      fieldAgentEmail: user.email,
      fieldAgentId: user.id,
    })
    .from(field)
    .innerJoin(fieldStage, eq(field.currentStageId, fieldStage.id))
    .leftJoin(user, eq(field.fieldAgentId, user.id))

  const agentsPromise = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.role, "field_agent"))

  const [rawFields, agents] = await Promise.all([
    rawFieldsPromise,
    agentsPromise,
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
            <h1 className="text-2xl font-semibold">All Fields</h1>
            <p className="text-sm text-muted-foreground">
              Manage fields across all agents
            </p>
          </div>
          <FieldAdminTable fields={fields} agents={agents} />
        </div>
      </div>
    </div>
  )
}
