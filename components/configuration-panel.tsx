"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Clock, Settings, AlertCircle, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffManagementPanel } from "@/components/staff-management-panel"
import { NotificationPreferences } from "@/components/notification-preferences"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslations } from 'next-intl'
import { LanguageSelector } from "@/components/language-selector"

// Expresiones regulares para validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\s()+-]+$/

interface ValidationErrors {
  restaurantName?: string
  email?: string
  phone?: string
}

export function ConfigurationPanel() {
  const { tenant, updateTenant } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('config')
  const tCommon = useTranslations('common')

  const [settings, setSettings] = useState({
    restaurantName: tenant?.name || "Restaurante Demo",
    description: "Restaurante familiar con comida casera",
    phone: "+54 11 1234-5678",
    email: "info@restaurante.com",
    address: "Av. Corrientes 1234, CABA",

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
  
  const [originalSettings] = useState(settings)
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Detectar cambios no guardados
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasUnsavedChanges(changed)
  }, [settings, originalSettings])

  // Advertir antes de salir con cambios no guardados
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Validar campos en tiempo real
  const validateField = (field: keyof ValidationErrors, value: string): string | undefined => {
    switch (field) {
      case 'restaurantName':
        if (!value.trim()) return t('restaurantNameRequired')
        if (value.trim().length < 3) return t('restaurantNameMinLength')
        break
      case 'email':
        if (!value.trim()) return t('emailRequired')
        if (!EMAIL_REGEX.test(value)) return t('emailInvalid')
        break
      case 'phone':
        if (value && !PHONE_REGEX.test(value)) return t('phoneInvalid')
        break
    }
    return undefined
  }

  const handleFieldChange = (field: string, value: string | boolean | string[]) => {
    setSettings({ ...settings, [field]: value })

    // Validar campos de texto
    if (typeof value === 'string' && (field === 'restaurantName' || field === 'email' || field === 'phone')) {
      const error = validateField(field as keyof ValidationErrors, value)
      setValidationErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }
  }

  const hasErrors = Object.values(validationErrors).some(error => error !== undefined)

  const handleSave = async () => {
    // Validar todos los campos antes de guardar
    const errors: ValidationErrors = {
      restaurantName: validateField('restaurantName', settings.restaurantName),
      email: validateField('email', settings.email),
      phone: validateField('phone', settings.phone),
    }

    setValidationErrors(errors)

    // Si hay errores, no guardar
    if (Object.values(errors).some(error => error !== undefined)) {
      toast({
        title: t('validationError'),
        description: t('fixErrorsBeforeSaving'),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mock save operation
      updateTenant({
        name: settings.restaurantName,
      })

      toast({
        title: "✓ " + t('configurationSaved'),
        description: t('changesSavedSuccessfully'),
      })
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("[v0] Error saving configuration", error)
      toast({
        title: t('errorSavingConfiguration'),
        description: t('couldNotSaveConfiguration'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const daysOfWeek = [
    { value: "monday", label: "Lunes" },
    { value: "tuesday", label: "Martes" },
    { value: "wednesday", label: "Miércoles" },
    { value: "thursday", label: "Jueves" },
    { value: "friday", label: "Viernes" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{t('configuration')}</h1>
          <p className="text-muted-foreground font-light">
            {t('generalSettings')}
            {hasUnsavedChanges && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                • {t('unsavedChanges')}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isLoading || hasErrors}
          variant={hasUnsavedChanges ? "default" : "outline"}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? tCommon('saving') : hasUnsavedChanges ? tCommon('saveChanges') : tCommon('saved')}
        </Button>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('fixErrorsBeforeSaving')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">{t('generalSettings')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('schedule')}</TabsTrigger>
          <TabsTrigger value="services">{t('services')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
          <TabsTrigger value="staff">{t('staff')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="flex items-center gap-2 font-light dark:text-zinc-100">
                <Settings className="h-5 w-5" />
                {t('generalSettings')}
              </CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">{t('generalSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Language selector */}
              <LanguageSelector />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">
                    {t('restaurantName')}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => handleFieldChange('restaurantName', e.target.value)}
                    className={validationErrors.restaurantName ? 'border-destructive' : ''}
                  />
                  {validationErrors.restaurantName && (
                    <p className="text-sm text-destructive">{validationErrors.restaurantName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className={validationErrors.phone ? 'border-destructive' : ''}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-destructive">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t('email')}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={validationErrors.email ? 'border-destructive' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('scheduleSettings')}
              </CardTitle>
              <CardDescription>{t('scheduleSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="openTime">{t('openTime')}</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={settings.openTime}
                    onChange={(e) => handleFieldChange('openTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">{t('closeTime')}</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={settings.closeTime}
                    onChange={(e) => handleFieldChange('closeTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('closedDays')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.value}
                        checked={settings.closedDays.includes(day.value)}
                        onChange={(e) => {
                          const newClosedDays = e.target.checked
                            ? [...settings.closedDays, day.value]
                            : settings.closedDays.filter((d) => d !== day.value)
                          handleFieldChange('closedDays', newClosedDays)
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
              <CardTitle>{t('servicesSettings')}</CardTitle>
              <CardDescription>{t('servicesSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tableService">{t('tableService')}</Label>
                    <p className="text-sm text-muted-foreground">{t('tableServiceDesc')}</p>
                  </div>
                  <Switch
                    id="tableService"
                    checked={settings.tableServiceEnabled}
                    onCheckedChange={(checked) => handleFieldChange('tableServiceEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="takeaway">{t('takeaway')}</Label>
                    <p className="text-sm text-muted-foreground">{t('takeawayDesc')}</p>
                  </div>
                  <Switch
                    id="takeaway"
                    checked={settings.takeawayEnabled}
                    onCheckedChange={(checked) => handleFieldChange('takeawayEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="delivery">{t('delivery')}</Label>
                    <p className="text-sm text-muted-foreground">{t('deliveryDesc')}</p>
                  </div>
                  <Switch
                    id="delivery"
                    checked={settings.deliveryEnabled}
                    onCheckedChange={(checked) => handleFieldChange('deliveryEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reservations">{t('reservations')}</Label>
                    <p className="text-sm text-muted-foreground">{t('reservationsDesc')}</p>
                  </div>
                  <Switch
                    id="reservations"
                    checked={settings.reservationsEnabled}
                    onCheckedChange={(checked) => handleFieldChange('reservationsEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
            <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardTitle className="flex items-center gap-2 font-light dark:text-zinc-100">
                <Bell className="h-5 w-5" />
                {t('notificationsSettings')}
              </CardTitle>
              <CardDescription className="font-light dark:text-zinc-400">
                {t('notificationsSettings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <NotificationPreferences />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <StaffManagementPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}


