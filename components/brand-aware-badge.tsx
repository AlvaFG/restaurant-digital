"use client"

import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BrandAwareBadgeProps extends BadgeProps {
  useBrandColor?: boolean
}

export function BrandAwareBadge({
  useBrandColor = false,
  className,
  variant = "default",
  ...props
}: BrandAwareBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        useBrandColor && variant === "default" && "bg-brand-accent text-white",
        useBrandColor && variant === "outline" && "border-brand-accent text-brand-accent",
        useBrandColor && variant === "secondary" && "bg-brand-accent/10 text-brand-accent",
        className,
      )}
      {...props}
    />
  )
}
