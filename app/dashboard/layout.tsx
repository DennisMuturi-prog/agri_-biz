import { db } from "@/database"
import { user } from "@/db/auth-schema"
import { sql, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AppSidebar } from "@/components/app-sidebar"

import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isAdmin = session?.user?.role === "admin"

  let unassignedCount = 0
  if (isAdmin) {
    const result = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(user)
      .where(isNull(user.role))
    unassignedCount = result[0]?.count ?? 0
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        isAdmin={isAdmin}
        unassignedCount={unassignedCount}
      />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
