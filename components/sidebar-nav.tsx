"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { NotificationBell } from "@/components/notification-bell"
import {
  LayoutDashboard,
  MapPin,
  Table,
  ShoppingCart,
  Bell,
  Users,
  Settings,
  BarChart3,
  Puzzle,
  LogOut,
  ChefHat,
  Edit,
  Palette,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ("admin" | "staff")[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
  },
  {
    title: "SalÃ³n",
    href: "/salon",
    icon: MapPin,
    roles: ["admin", "staff"],
  },
  {
    title: "Mesas",
    href: "/mesas",
    icon: Table,
    roles: ["admin", "staff"],
  },
  {
    title: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    roles: ["admin", "staff"],
  },
  {
    title: "Alertas",
    href: "/alertas",
    icon: Bell,
    roles: ["admin", "staff"],
  },
  // Admin only sections
  {
    title: "MenÃº",
    href: "/menu",
    icon: ChefHat,
    roles: ["admin"],
  },
  {
    title: "Editor de Mesas",
    href: "/mesas/editor",
    icon: Edit,
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "AnalÃ­tica",
    href: "/analitica",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Integraciones",
    href: "/integraciones",
    icon: Puzzle,
    roles: ["admin"],
  },
  {
    title: "ConfiguraciÃ³n",
    href: "/configuracion",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "Branding",
    href: "/configuracion/branding",
    icon: Palette,
    roles: ["admin"],
  },
]

export function SidebarNav() {
  const { user, logout, tenant } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          {tenant?.logoUrl ? (
            <Image
              src={tenant?.logoUrl || "/placeholder.svg"}
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-accent text-white">
              <ChefHat className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{tenant?.name || "Restaurante"}</span>
            <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 h-9",
                    isActive && "bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Separator className="my-2" />
        <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Cerrar SesiÃ³n
        </Button>
      </div>
    </div>
  )
}



