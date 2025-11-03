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
  MapPinned,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ("admin" | "staff" | "manager")[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
  },
  {
    title: "Salón",
    href: "/salon",
    icon: MapPin,
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
    title: "Menú",
    href: "/menu",
    icon: ChefHat,
    roles: ["admin"],
  },
  {
    title: "Zonas",
    href: "/configuracion/zonas",
    icon: MapPinned,
    roles: ["admin"],
  },
  {
    title: "Analítica",
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
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
    roles: ["admin"],
  },
]

export function SidebarNav() {
  const { user, logout, tenant } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border/80 dark:bg-zinc-900 dark:border-zinc-700">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/80 px-6 bg-muted/50 dark:bg-zinc-800 dark:border-zinc-700">
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
            <span className="text-sm font-light">{tenant?.name || "Restaurante"}</span>
            <span className="text-xs text-muted-foreground capitalize font-light">{user.role}</span>
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
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 h-9 font-light border mb-0.5",
                    isActive && "bg-accent text-accent-foreground border-border/70 shadow-sm dark:bg-zinc-800 dark:text-white dark:border-zinc-600 dark:shadow-lg",
                    !isActive && "hover:bg-accent/50 border-transparent hover:border-border/50 dark:hover:bg-zinc-800/50 dark:border-transparent dark:hover:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
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
      <div className="border-t border-border/80 p-3 bg-muted/50 dark:bg-zinc-800 dark:border-zinc-700">
        <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg border border-border/70 bg-card shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground dark:bg-zinc-700 dark:text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-light dark:text-zinc-100">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground font-light dark:text-zinc-400">{user.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <Separator className="my-2 bg-border/60 dark:bg-zinc-700" />
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 font-light border border-transparent hover:bg-accent/50 hover:border-border/50 dark:hover:bg-zinc-800/50 dark:hover:border-zinc-700 dark:text-zinc-300 dark:hover:text-white" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}



