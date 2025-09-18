"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BrandAwareButtonProps extends ButtonProps {
  useBrandColor?: boolean
}

export function BrandAwareButton({
  useBrandColor = false,
  className,
  variant = "default",
  ...props
}: BrandAwareButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        useBrandColor && variant === "default" && "bg-brand-accent hover:bg-brand-accent/90 text-white",
        useBrandColor && variant === "outline" && "border-brand-accent text-brand-accent hover:bg-brand-accent/10",
        useBrandColor && variant === "ghost" && "text-brand-accent hover:bg-brand-accent/10",
        className,
      )}
      {...props}
    />
  )
}
