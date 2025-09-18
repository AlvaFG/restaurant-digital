"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Save, Clock, DollarSign, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ConfigurationPanel() {
  const { tenant, updateTenant } = useAuth()
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    restaurantName: tenant?.name || "Restaurante Demo",
    description: "Restaurante familiar con comida casera",
    phone: "+54 11 1234-5678",
    email: "info@restaurante.com",
    address: "Av. Corrientes 1234, CABA",

    // Tips configuration
    tipsEnabled: true,
    defaultTipPercentage: 10,
    suggestedTips: [10, 15, 20],

    // Schedule configuration
    openTime: "11:00",
    closeTime: "23:00",
    closedDays: [] as string[],

    // Service configuration
    tableServiceEnabled: true,
    takeawayEnabled: true,
    deliveryEnabled: false,
    reservationsEnabled: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Mock save operation
      updateTenant({
        name: settings.restaurantName,
      })

      toast({
        title: "ConfiguraciÃ³n guardada",
        description: "Los cambios han sido guardados exitosamente",
      })
    } catch (error) {
      console.error("[v0] Error saving configuration", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuraciÃ³n",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      toast({
        title: "Logo seleccionado",
        description: "Guarda los cambios para aplicar el nuevo logo",
      })
    }
  }

  const daysOfWeek = [
    { value: "monday", label: "Lunes" },
    { value: "tuesday", label: "Martes" },
    { value: "wednesday", label: "MiÃ©rcoles" },
    { value: "thursday", label: "Jueves" },
    { value: "friday", label: "Viernes" },
    { value: "saturday", label: "SÃ¡bado" },
    { value: "sunday", label: "Domingo" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ConfiguraciÃ³n</h1>
          <p className="text-muted-foreground">Gestiona la configuraciÃ³n general del restaurante</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tips">Propinas</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                InformaciÃ³n General
              </CardTitle>
              <CardDescription>ConfiguraciÃ³n bÃ¡sica del restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">TelÃ©fono</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">DescripciÃ³n</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">DirecciÃ³n</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="logo">Logo del Restaurante</Label>
                <div className="flex items-center gap-4">
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1" />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Formatos soportados: JPG, PNG, SVG. TamaÃ±o mÃ¡ximo: 2MB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                ConfiguraciÃ³n de Propinas
              </CardTitle>
              <CardDescription>Gestiona cÃ³mo se manejan las propinas en el restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tipsEnabled">Habilitar Propinas</Label>
                  <p className="text-sm text-muted-foreground">Permite a los clientes dejar propina</p>
                </div>
                <Switch
                  id="tipsEnabled"
                  checked={settings.tipsEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, tipsEnabled: checked })}
                />
              </div>

              {settings.tipsEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="defaultTip">Propina por Defecto (%)</Label>
                    <Select
                      value={settings.defaultTipPercentage.toString()}
                      onValueChange={(value) =>
                        setSettings({ ...settings, defaultTipPercentage: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Opciones Sugeridas (%)</Label>
                    <div className="flex gap-2">
                      {settings.suggestedTips.map((tip, index) => (
                        <Input
                          key={index}
                          type="number"
                          value={tip}
                          onChange={(e) => {
                            const newTips = [...settings.suggestedTips]
                            newTips[index] = Number.parseInt(e.target.value) || 0
                            setSettings({ ...settings, suggestedTips: newTips })
                          }}
                          className="w-20"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de AtenciÃ³n
              </CardTitle>
              <CardDescription>Configura los horarios de funcionamiento del restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Hora de Apertura</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={settings.openTime}
                    onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Hora de Cierre</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={settings.closeTime}
                    onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>DÃ­as Cerrados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.value}
                        checked={settings.closedDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({ ...settings, closedDays: [...settings.closedDays, day.value] })
                          } else {
                            setSettings({
                              ...settings,
                              closedDays: settings.closedDays.filter((d) => d !== day.value),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Disponibles</CardTitle>
              <CardDescription>Configura quÃ© servicios ofrece el restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tableService">Servicio en Mesa</Label>
                    <p className="text-sm text-muted-foreground">AtenciÃ³n con mozo en el local</p>
                  </div>
                  <Switch
                    id="tableService"
                    checked={settings.tableServiceEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, tableServiceEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="takeaway">Para Llevar</Label>
                    <p className="text-sm text-muted-foreground">Pedidos para retirar en el local</p>
                  </div>
                  <Switch
                    id="takeaway"
                    checked={settings.takeawayEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, takeawayEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="delivery">Delivery</Label>
                    <p className="text-sm text-muted-foreground">Entrega a domicilio</p>
                  </div>
                  <Switch
                    id="delivery"
                    checked={settings.deliveryEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, deliveryEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reservations">Reservas</Label>
                    <p className="text-sm text-muted-foreground">Sistema de reservas de mesas</p>
                  </div>
                  <Switch
                    id="reservations"
                    checked={settings.reservationsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, reservationsEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


