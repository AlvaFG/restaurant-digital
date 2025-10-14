"use client"

/**
 * Panel de gestion de usuarios staff.
 * Solo accesible para usuarios con rol administrador.
 */

import { useCallback, useEffect, useState } from 'react'
import { Loader2, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/lib/logger'

interface StaffUser {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  created_at: string
  created_by_admin_id: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function StaffManagementPanel() {
  const { user } = useAuth()
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPassword, setNewStaffPassword] = useState('')

  const resetForm = () => {
    setNewStaffName('')
    setNewStaffEmail('')
    setNewStaffPassword('')
    setShowPassword(false)
    setFormError('')
  }

  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true)
      setGlobalError('')
      const response = await fetch('/api/auth/staff')

      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios')
      }

      const data = await response.json()
      setStaffList((data.data?.staff as StaffUser[]) ?? [])
    } catch (error) {
      logger.error('Error al cargar staff', error as Error)
      setGlobalError('Ocurrio un problema al cargar el staff. Intenta nuevamente mas tarde.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadStaff()
    }
  }, [user?.role, loadStaff])

  if (user?.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No tenes permisos para acceder a esta seccion. Solo los administradores pueden gestionar el staff.
        </AlertDescription>
      </Alert>
    )
  }

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const trimmedName = newStaffName.trim()
    const trimmedEmail = newStaffEmail.trim().toLowerCase()

    if (!trimmedName || !trimmedEmail || !newStaffPassword) {
      setFormError('Completa todos los campos antes de guardar.')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Ingresa un correo electronico valido.')
      return
    }

    if (newStaffPassword.length < 6) {
      setFormError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: newStaffPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message ?? data.error ?? 'No se pudo crear el usuario')
      }

      setSuccessMessage('Usuario staff creado correctamente.')
      setShowCreateDialog(false)
      resetForm()
      await loadStaff()
    } catch (error) {
      logger.error('Error al crear staff', error as Error)
      setFormError(error instanceof Error ? error.message : 'No se pudo crear el usuario.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteStaff = async (staffId: string, staffEmail: string) => {
    const confirmation = window.confirm(
      `AQueres eliminar al usuario ${staffEmail}? Esta accion no se puede deshacer.`,
    )

    if (!confirmation) {
      return
    }

    try {
      const response = await fetch(`/api/auth/staff/${staffId}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('No se pudo eliminar el usuario staff.')
      }

      setSuccessMessage('Usuario staff eliminado correctamente.')
      await loadStaff()
    } catch (error) {
      logger.error('Error al eliminar staff', error as Error)
      setGlobalError(error instanceof Error ? error.message : 'No se pudo eliminar el usuario.')
    }
  }

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/auth/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado del usuario.')
      }

      setSuccessMessage(!currentActive ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.')
      await loadStaff()
    } catch (error) {
      logger.error('Error al actualizar estado', error as Error)
      setGlobalError(error instanceof Error ? error.message : 'No se pudo actualizar el estado del usuario.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Gestion de staff</h2>
          <p className="text-sm text-muted-foreground">
            Crea, activa o elimina usuarios con acceso limitado al sistema.
          </p>
        </div>
        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open)
            if (!open) {
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar usuario staff</DialogTitle>
              <DialogDescription>
                Los usuarios staff tienen acceso limitado y dependen de tu cuenta para iniciar sesion.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateStaff}>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Nombre completo</Label>
                <Input
                  id="staff-name"
                  value={newStaffName}
                  onChange={(event) => setNewStaffName(event.target.value)}
                  placeholder="Ejemplo: Ana Gomez"
                  disabled={isCreating}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Correo electronico</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={newStaffEmail}
                  onChange={(event) => setNewStaffEmail(event.target.value)}
                  placeholder="ejemplo@tuempresa.com"
                  disabled={isCreating}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password">Contrasena</Label>
                <div className="relative">
                  <Input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newStaffPassword}
                    onChange={(event) => setNewStaffPassword(event.target.value)}
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                    disabled={isCreating}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isCreating}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">
                      {showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    </span>
                  </Button>
                </div>
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar usuario
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {globalError && (
        <Alert variant="destructive">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuarios staff</CardTitle>
          <CardDescription>
            Listado de colaboradores con acceso restringido al panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No hay usuarios staff registrados aun.</p>
              <p className="mt-2 text-sm">Crea el primero con el boton Crear usuario.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      <Badge variant={staff.active ? 'default' : 'secondary'}>
                        {staff.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(staff.created_at).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(staff.id, staff.active)}
                        >
                          {staff.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStaff(staff.id, staff.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

