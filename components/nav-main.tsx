"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  const isAdmin = session?.user?.role === "admin"

  function isActiveRoute(itemUrl: string): boolean {
    if (pathname === itemUrl) return true
    if (itemUrl === "/dashboard") return false

    // Handle admin variant: /dashboard/fields should match /dashboard/fields-admin
    const adminVariant = itemUrl + "-admin"
    if (pathname === adminVariant || pathname.startsWith(adminVariant + "/"))
      return true

    return pathname.startsWith(itemUrl + "/")
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {isAdmin && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                onClick={() => {
                  router.push("/dashboard/create_field")
                }}
                tooltip="Create Field"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <CirclePlusIcon />
                <span>Create Field</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isActiveRoute(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  className={
                    isActive
                      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-ring!"
                      : ""
                  }
                  onClick={() => {
                    router.push(item.url)
                  }}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
