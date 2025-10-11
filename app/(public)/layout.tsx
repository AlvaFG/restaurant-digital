import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import "./qr/_styles/animations.css"

export const metadata: Metadata = {
  title: "Carta digital QR | Restaurante 360",
  description: "Accede al menu digital escaneando el QR de tu mesa.",
}

interface PublicLayoutProps {
  children: ReactNode
  className?: string
}

export default function PublicLayout({ children, className }: PublicLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground antialiased",
        "flex flex-col",
        className,
      )}
    >
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  )
}
