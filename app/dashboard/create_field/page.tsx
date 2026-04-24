import { db } from "@/database"
import { fieldStage } from "@/db/field-stage"
import { user } from "@/db/auth-schema"
import { eq } from "drizzle-orm"
import { CreateFieldForm } from "@/components/create_field_form"

export default async function CreateFieldPage() {
  const stages = await db
    .select({ id: fieldStage.id, name: fieldStage.name })
    .from(fieldStage)

  const agents = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "field_agent"))

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CreateFieldForm stages={stages} agents={agents} />
      </div>
    </div>
  )
}
