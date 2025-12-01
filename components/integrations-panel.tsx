"use client"

import { useTranslations } from "next-intl"
import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tablet, Monitor, CreditCard, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
}

export function IntegrationsPanel() {
  const tCommon = useTranslations('common')
  const { tenant, updateTenant } = useAuth()
  const { toast } = useToast()

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "tablets",
      name: "Tablets",
      description: "Tablets para pedidos de clientes en mesa",
      icon: Tablet,
      enabled: tenant?.features.tablets || false,
    },
    {
      id: "kds",
      name: "KDS (Kitchen Display System)",
      description: "Sistema de pantallas para cocina",
      icon: Monitor,
      enabled: tenant?.features.kds || false,
    },
    {
      id: "payments",
      name: "Pagos",
      description: "Procesamiento de pagos con tarjeta",
      icon: CreditCard,
      enabled: tenant?.features.payments || false,
    },
  ])

  const [pairingTokens] = useState({
    tablet: "TBL-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    kds: "KDS-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    payment: "PAY-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
  })

  const handleToggleIntegration = (integrationId: string, enabled: boolean) => {
    setIntegrations(
      integrations.map((integration) => (integration.id === integrationId ? { ...integration, enabled } : integration)),
    )

    // Update tenant features
    const featureKey = integrationId as keyof typeof tenant.features
    updateTenant({
      features: {
        ...tenant?.features,
        [featureKey]: enabled,
      },
    })

    toast({
      title: enabled ? "Integración activada" : "Integración desactivada",
      description: `${integrations.find((i) => i.id === integrationId)?.name} ha sido ${enabled ? "activada" : "desactivada"}`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Token copiado al portapapeles",
    })
  }

  const regenerateToken = (tokenType: string) => {
    toast({
      title: "Token regenerado",
      description: `Nuevo token de ${tokenType} generado`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Integrations */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Módulos del Sistema</h2>
          <p className="text-muted-foreground">Activa o desactiva funcionalidades del restaurante</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <integration.icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  <Badge variant={integration.enabled ? "default" : "secondary"}>
                    {integration.enabled ? tCommon('active') : tCommon('inactive')}
                  </Badge>
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`toggle-${integration.id}`} className="text-sm font-medium">
                    {integration.enabled ? "Desactivar" : "Activar"}
                  </Label>
                  <Switch
                    id={`toggle-${integration.id}`}
                    checked={integration.enabled}
                    onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Pairing Tokens */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Tokens de Emparejamiento</h2>
          <p className="text-muted-foreground">Usa estos tokens para conectar dispositivos externos al sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tablet className="h-5 w-5" />
                Token de Tablet
              </CardTitle>
              <CardDescription>Para conectar tablets de mesa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={pairingTokens.tablet} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(pairingTokens.tablet)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => regenerateToken("tablet")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Válido por 24 horas. Regenera si es necesario.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Token de KDS
              </CardTitle>
              <CardDescription>Para conectar pantallas de cocina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={pairingTokens.kds} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(pairingTokens.kds)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => regenerateToken("kds")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Válido por 24 horas. Regenera si es necesario.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Token de Pagos
              </CardTitle>
              <CardDescription>Para conectar terminales de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={pairingTokens.payment} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(pairingTokens.payment)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => regenerateToken("payment")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Válido por 24 horas. Regenera si es necesario.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
