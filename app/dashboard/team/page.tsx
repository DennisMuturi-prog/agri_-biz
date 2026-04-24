import type { Metadata } from "next"
import { db } from "@/database"
import { user } from "@/db/auth-schema"
import { field } from "@/db/field"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq, sql } from "drizzle-orm"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX } from "lucide-react"
import { PromoteButton } from "./promote-button"

export const metadata: Metadata = {
  title: "Team",
}

function formatTimestampToDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">
          This page is only available to admins.
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  // Fetch all users with their field count
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      fieldCount: sql<number>`cast(count(${field.id}) as int)`,
    })
    .from(user)
    .leftJoin(field, eq(field.fieldAgentId, user.id))
    .groupBy(user.id, user.name, user.email, user.role, user.createdAt)
    .orderBy(user.role)

  const admins = allUsers.filter((u) => u.role === "admin")
  const fieldAgents = allUsers.filter((u) => u.role === "field_agent")
  const unassigned = allUsers.filter(
    (u) => u.role !== "admin" && u.role !== "field_agent"
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="flex items-center justify-between px-4 lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold">Team</h1>
              <p className="text-sm text-muted-foreground">
                Manage users and their roles
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums">
                    {allUsers.length}
                  </CardTitle>
                </div>
                <Users className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Field Agents</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums">
                    {fieldAgents.length}
                  </CardTitle>
                </div>
                <UserCheck className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>Unassigned Users</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums">
                    {unassigned.length}
                  </CardTitle>
                </div>
                <UserX className="size-8 text-muted-foreground/40" />
              </CardHeader>
            </Card>
          </div>

          {/* Admins Section */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admins</CardTitle>
                <CardDescription>
                  Users with full administrative access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {admins.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No admins found.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {admins.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Admin
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Field Agents Section */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Field Agents</CardTitle>
                <CardDescription>
                  Users who can manage assigned fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fieldAgents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No field agents yet.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {fieldAgents.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {u.fieldCount} field
                              {u.fieldCount !== 1 ? "s" : ""}
                            </span>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Agent
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unassigned Users Section */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unassigned Users</CardTitle>
                <CardDescription>
                  Users who have not been assigned a role yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unassigned.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      All users have been assigned a role.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {unassigned.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted-foreground/10 text-sm font-medium text-muted-foreground">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {formatTimestampToDate(u.createdAt)}
                              </p>
                            </div>
                          </div>
                          <PromoteButton userId={u.id} userName={u.name} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
