import type { Metadata } from "next"
import { db } from "@/database"
import { fieldStage } from "@/db/field-stage"
import { user } from "@/db/auth-schema"
import { eq } from "drizzle-orm"
import { CreateFieldForm } from "@/components/create_field_form"

export const metadata: Metadata = {
  title: "Create Field",
}

export default async function CreateFieldPage() {
  const stages = await db
    .select({ id: fieldStage.id, name: fieldStage.name })
    .from(fieldStage)

  const agents = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "field_agent"))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold">Create Field</h1>
            <p className="text-sm text-muted-foreground">
              Register a new agricultural field
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-sm px-4 lg:px-6">
              <CreateFieldForm stages={stages} agents={agents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
