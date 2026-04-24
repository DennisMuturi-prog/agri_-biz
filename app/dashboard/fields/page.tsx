import { db } from "@/database"
import { field } from "@/db/field"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { FieldTable } from "@/components/field-table"
import { fieldStage } from "@/db/field-stage"

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

  const fields = await db
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

  const stages = await db
    .select({
      id: fieldStage.id,
      name: fieldStage.name,
    })
    .from(fieldStage)

  return <FieldTable fields={fields} stages={stages} />
}
