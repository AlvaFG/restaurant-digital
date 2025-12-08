"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ZonesDiagnosticPanel } from "@/components/zones-diagnostic-panel"

export default function DiagnosticPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Diagnóstico del Sistema</h1>
          <p className="text-muted-foreground font-light">
            Herramientas de diagnóstico para resolver problemas del sistema.
          </p>
        </div>

        <ZonesDiagnosticPanel />
      </div>
    </DashboardLayout>
  )
}
