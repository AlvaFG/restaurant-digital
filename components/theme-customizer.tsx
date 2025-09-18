"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Palette, Sun, Moon, Monitor, Save, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import Image from "next/image"

interface BrandingSettings {
  accentColor: string
  logoUrl?: string
  logoFile?: File
}

const PRESET_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "PÃºrpura", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Naranja", value: "#f97316" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Ãndigo", value: "#6366f1" },
  { name: "Esmeralda", value: "#059669" },
]

export function ThemeCustomizer() {
  const { tenant, updateTenant } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [branding, setBranding] = useState<BrandingSettings>({
    accentColor: tenant?.theme?.accentColor || "#3b82f6",
    logoUrl: tenant?.logoUrl,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Apply theme changes in real-time
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--brand-accent", branding.accentColor)
    root.style.setProperty("--brand-accent-foreground", "#ffffff")
  }, [branding.accentColor])

  const handleColorChange = (color: string) => {
    setBranding({ ...branding, accentColor: color })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setBranding({
        ...branding,
        logoFile: file,
        logoUrl: previewUrl,
      })

      toast({
        title: "Logo seleccionado",
        description: "Vista previa cargada. Guarda los cambios para aplicar.",
      })
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would upload the logo file to a storage service
      let logoUrl = branding.logoUrl
      if (branding.logoFile) {
        // Mock upload - in real app this would be an actual upload
        logoUrl = `/logos/${branding.logoFile.name}`
        console.log("[v0] Mock logo upload:", branding.logoFile.name)
      }

      updateTenant({
        theme: {
          accentColor: branding.accentColor,
        },
        logoUrl,
      })

      toast({
        title: "Branding actualizado",
        description: "Los cambios de marca han sido guardados exitosamente",
      })
    } catch (error) {
      console.error("[v0] Error saving branding", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuraciÃ³n de marca",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setBranding({
      accentColor: "#3b82f6",
      logoUrl: undefined,
    })

    toast({
      title: "ConfiguraciÃ³n restablecida",
      description: "Se han restaurado los valores por defecto",
    })
  }

  const PreviewCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PersonalizaciÃ³n de Marca</h2>
          <p className="text-muted-foreground">Personaliza la apariencia de tu restaurante</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo del Restaurante
              </CardTitle>
              <CardDescription>Sube el logo de tu restaurante (PNG, JPG, SVG)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding.logoUrl && (
                <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
                  <Image
                    src={branding.logoUrl || "/placeholder.svg"}
                    alt="Logo preview"
                    width={128}
                    height={64}
                    className="h-16 w-32 object-contain"
                    unoptimized
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <Input type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1" id="logo-upload" />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("logo-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos soportados: PNG, JPG, SVG. TamaÃ±o recomendado: 200x60px
              </p>
            </CardContent>
          </Card>

          {/* Color Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color de Acento
              </CardTitle>
              <CardDescription>Elige el color principal de tu marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Input */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-border"
                    style={{ backgroundColor: branding.accentColor }}
                />
                  <Input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-10 p-1 border-0"
                />
                </div>
                <Input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#3b82f6"
                />
              </div>

              {/* Preset Colors */}
              <div>
                <Label className="text-sm font-medium">Colores Predefinidos</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <Button
                      key={color.value}
                      variant="outline"
                      size="sm"
                      className="h-10 p-2 bg-transparent"
                      onClick={() => handleColorChange(color.value)}
                      style={{
                        backgroundColor: color.value === branding.accentColor ? color.value : "transparent",
                        borderColor: color.value,
                        color: color.value === branding.accentColor ? "white" : color.value,
                      }}
                    >
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Modo de Tema
              </CardTitle>
              <CardDescription>Configura el tema claro/oscuro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Claro
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Oscuro
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AsÃ­ se verÃ¡n los elementos con tu configuraciÃ³n de marca
            </p>
          </div>

          <PreviewCard title="Botones">
            <div className="flex flex-wrap gap-2">
              <Button className="bg-brand-accent hover:bg-brand-accent/90">BotÃ³n Principal</Button>
              <Button
                variant="outline"
                className="border-brand-accent text-brand-accent hover:bg-brand-accent/10 bg-transparent"
              >
                BotÃ³n Secundario
              </Button>
              <Button variant="ghost" className="text-brand-accent hover:bg-brand-accent/10">
                BotÃ³n Fantasma
              </Button>
            </div>
          </PreviewCard>

          <PreviewCard title="Enlaces y Badges">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="text-brand-accent hover:underline">
                  Enlace de ejemplo
                </a>
                <a href="#" className="text-brand-accent hover:underline font-medium">
                  Enlace destacado
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-brand-accent text-white">Estado Activo</Badge>
                <Badge variant="outline" className="border-brand-accent text-brand-accent">
                  InformaciÃ³n
                </Badge>
                <Badge variant="secondary" className="bg-brand-accent/10 text-brand-accent">
                  Destacado
                </Badge>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Elementos de NavegaciÃ³n">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-brand-accent/10">
                <div className="w-2 h-2 rounded-full bg-brand-accent" />
                <span className="text-sm text-brand-accent font-medium">Elemento Activo</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-sm">Elemento Normal</span>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Tarjetas y Contenido">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Mesa 5</h4>
                  <Badge className="bg-brand-accent text-white">Ocupada</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Ejemplo de tarjeta con branding aplicado</p>
                <Button size="sm" className="mt-2 bg-brand-accent hover:bg-brand-accent/90">
                  Ver Detalles
                </Button>
              </div>
            </div>
          </PreviewCard>
        </div>
      </div>
    </div>
  )
}




