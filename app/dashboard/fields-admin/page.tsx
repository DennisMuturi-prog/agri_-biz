import { db } from "@/database"
import { field } from "@/db/field"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { fieldStage } from "@/db/field-stage"
import Link from "next/link"
import { FieldAdminTable } from "@/components/field-table-admin"
import { user } from "@/db/auth-schema"
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
  const fields = await db
    .select({
      id: field.id,
      name: field.name,
      plantingDate: field.plantingDate,
      cropType: field.cropType,
      fieldStage: fieldStage.name,
      fieldAgentName: user.name,
      fieldAgentEmail:user.email,
      fieldAgentId: user.id,
    })
    .from(field)
    .innerJoin(fieldStage, eq(field.currentStageId, fieldStage.id))
    .innerJoin(user, eq(field.fieldAgentId, user.id))
  return (
    <div>
      <FieldAdminTable fields={fields} />
    </div>
  )
}
