"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ZonesManagement, type ZonesManagementRef } from "@/components/zones-management"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ZonasConfigPage() {
  const t = useTranslations('common')
  const zonesRef = useRef<ZonesManagementRef>(null)
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">{t('zonesManagementTitle')}</h1>
            <p className="text-muted-foreground font-light">
              {t('zonesManagementDescription')}
            </p>
          </div>
          <Button onClick={() => zonesRef.current?.openCreateModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Crear zona
          </Button>
        </div>
        <ZonesManagement ref={zonesRef} />
      </div>
    </DashboardLayout>
  )
}
