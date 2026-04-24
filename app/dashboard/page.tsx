import type { Metadata } from "next"
import { db } from "@/database"
import { field } from "@/db/field"
import { fieldStage } from "@/db/field-stage"
import { note } from "@/db/note"
import { user } from "@/db/auth-schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq, sql, desc } from "drizzle-orm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tractor,
  Sprout,
  Leaf,
  CheckCircle2,
  ClipboardList,
  Users,
  BarChart3,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
}

function formatTimestampToDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    Planted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Growing:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Ready:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Harvested:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  }
  return (
    <Badge className={colors[stage] ?? "bg-gray-100 text-gray-700"}>
      {stage}
    </Badge>
  )
}

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "admin"

  // Build the field query – filtered by agent for non-admins
  const fieldQuery = db
    .select({
      id: field.id,
      name: field.name,
      cropType: field.cropType,
      plantingDate: field.plantingDate,
      stageName: fieldStage.name,
      stageId: field.currentStageId,
      fieldAgentId: field.fieldAgentId,
      agentName: user.name,
      agentEmail: user.email,
    })
    .from(field)
    .innerJoin(fieldStage, eq(field.currentStageId, fieldStage.id))
    .innerJoin(user, eq(field.fieldAgentId, user.id))

  const allFields = isAdmin
    ? await fieldQuery
    : await fieldQuery.where(eq(field.fieldAgentId, session.user.id))

  // Stage breakdown
  const stageBreakdown = await db
    .select({
      name: fieldStage.name,
      count: sql<number>`cast(count(${field.id}) as int)`,
    })
    .from(fieldStage)
    .leftJoin(field, eq(field.currentStageId, fieldStage.id))
    .groupBy(fieldStage.id, fieldStage.name)
    .orderBy(fieldStage.id)

  // Total field count
  const totalFields = allFields.length

  // Recent notes activity (last 5)
  const recentNotes = isAdmin
    ? await db
        .select({
          id: note.id,
          observation: note.observation,
          createdAt: note.createdAt,
          fieldName: field.name,
        })
        .from(note)
        .innerJoin(field, eq(note.fieldId, field.id))
        .orderBy(desc(note.createdAt))
        .limit(5)
    : await db
        .select({
          id: note.id,
          observation: note.observation,
          createdAt: note.createdAt,
          fieldName: field.name,
        })
        .from(note)
        .innerJoin(field, eq(note.fieldId, field.id))
        .where(eq(field.fieldAgentId, session.user.id))
        .orderBy(desc(note.createdAt))
        .limit(5)

  // Crop type breakdown for admin
  const cropBreakdown = isAdmin
    ? await db
        .select({
          cropType: field.cropType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(field)
        .groupBy(field.cropType)
        .orderBy(sql`count(*) desc`)
        .limit(5)
    : null

  // Agent workload for admin (top 5 agents with most fields)
  const agentWorkload = isAdmin
    ? await db
        .select({
          name: user.name,
          email: user.email,
          count: sql<number>`cast(count(${field.id}) as int)`,
        })
        .from(user)
        .innerJoin(field, eq(field.fieldAgentId, user.id))
        .where(eq(user.role, "field_agent"))
        .groupBy(user.id, user.name, user.email)
        .orderBy(sql`count(${field.id}) desc`)
        .limit(5)
    : null

  // Insights
  const totalStages = stageBreakdown.reduce((acc, s) => acc + s.count, 0)
  const harvestedCount =
    stageBreakdown.find((s) => s.name === "Harvested")?.count ?? 0
  const plantedCount =
    stageBreakdown.find((s) => s.name === "Planted")?.count ?? 0
  const growingCount =
    stageBreakdown.find((s) => s.name === "Growing")?.count ?? 0
  const readyCount = stageBreakdown.find((s) => s.name === "Ready")?.count ?? 0
  const harvestRate =
    totalStages > 0 ? Math.round((harvestedCount / totalStages) * 100) : 0

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* ----- Page Header ----- */}
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Farm overview at a glance
            </p>
          </div>

          {/* ----- Summary Cards ----- */}
          <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Total Fields</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {totalFields}
                  </CardTitle>
                </div>
                <Tractor className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Planted / Growing</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {plantedCount + growingCount}
                  </CardTitle>
                </div>
                <Sprout className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Ready to Harvest</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {readyCount}
                  </CardTitle>
                </div>
                <Leaf className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Harvested</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {harvestedCount}
                  </CardTitle>
                </div>
                <CheckCircle2 className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
          </div>

          {/* ----- Main Content Grid ----- */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
            {/* Stage Breakdown */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage Breakdown</CardTitle>
                  <BarChart3 className="size-4 text-muted-foreground" />
                </div>
                <CardDescription>
                  Fields grouped by growth stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stageBreakdown.map((s) => {
                    const pct =
                      totalStages > 0
                        ? Math.round((s.count / totalStages) * 100)
                        : 0
                    return (
                      <div key={s.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <StageBadge stage={s.name} />
                          <span className="font-medium tabular-nums">
                            {s.count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* My Fields List (agent) or All Fields Preview (admin) */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isAdmin ? "All Fields" : "My Fields"}
                  </CardTitle>
                  <ClipboardList className="size-4 text-muted-foreground" />
                </div>
                <CardDescription>
                  {isAdmin
                    ? `${totalFields} field${totalFields !== 1 ? "s" : ""} across all agents`
                    : `${totalFields} field${totalFields !== 1 ? "s" : ""} assigned to you`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allFields.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No fields yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allFields.slice(0, 6).map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{f.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.cropType} &middot;{" "}
                            {formatTimestampToDate(f.plantingDate)}
                          </p>
                        </div>
                        <StageBadge stage={f.stageName} />
                      </div>
                    ))}
                    {allFields.length > 6 && (
                      <p className="pt-1 text-center text-xs text-muted-foreground">
                        +{allFields.length - 6} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Notes Activity */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Notes</CardTitle>
                  <ClipboardList className="size-4 text-muted-foreground" />
                </div>
                <CardDescription>Latest observations recorded</CardDescription>
              </CardHeader>
              <CardContent>
                {recentNotes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No notes recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentNotes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border bg-muted/20 px-3 py-2"
                      >
                        <p className="line-clamp-2 text-sm">{n.observation}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {n.fieldName} &middot;{" "}
                          {formatTimestampToDate(n.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ----- Insights Section (admin only) ----- */}
          {isAdmin && (
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              {/* Crop Type Distribution */}
              {cropBreakdown && cropBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Crop Type Distribution
                      </CardTitle>
                      <BarChart3 className="size-4 text-muted-foreground" />
                    </div>
                    <CardDescription>
                      Most common crop types across all fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cropBreakdown.map((c) => {
                        const pct = Math.round((c.count / totalFields) * 100)
                        return (
                          <div key={c.cropType}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span>{c.cropType}</span>
                              <span className="font-medium tabular-nums">
                                {c.count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent Workload */}
              {agentWorkload && agentWorkload.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Agent Workload
                      </CardTitle>
                      <Users className="size-4 text-muted-foreground" />
                    </div>
                    <CardDescription>Fields assigned per agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agentWorkload.map((a) => {
                        const maxCount = agentWorkload[0]?.count ?? 1
                        const pct = Math.round((a.count / maxCount) * 100)
                        return (
                          <div key={a.email}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium">{a.name}</span>
                              <span className="text-muted-foreground tabular-nums">
                                {a.count} field{a.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-amber-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Insight */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Farm Overview Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {harvestRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Harvest rate
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {harvestedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fields harvested
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {growingCount + readyCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fields in active growth
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ----- Agent Insights ----- */}
          {!isAdmin && (
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {harvestedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fields harvested
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {growingCount + readyCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fields in active growth
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>
                    Latest notes you&apos;ve recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentNotes.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No activity yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recentNotes.slice(0, 3).map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg border bg-muted/20 px-3 py-2"
                        >
                          <p className="line-clamp-1 text-sm">
                            {n.observation}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {n.fieldName} &middot;{" "}
                            {formatTimestampToDate(n.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
