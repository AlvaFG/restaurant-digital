"use client"

/**
 * Panel de Gestión de Usuarios Staff
 * Solo accesible para usuarios con rol 'admin'
 */

import { useState, useEffect } from 'react'
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
import { Loader2, UserPlus, Trash2, Edit, Eye, EyeOff } from 'lucide-react'
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

export function StaffManagementPanel() {
  const { user } = useAuth()
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Form state para crear staff
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Verificar que el usuario es admin
  if (user?.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios staff.
        </AlertDescription>
      </Alert>
    )
  }

  // Cargar lista de staff
  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/staff')
      
      if (!response.ok) {
        throw new Error('Error al cargar lista de staff')
      }

      const data = await response.json()
      setStaffList(data.data?.staff || [])
    } catch (err) {
      logger.error('Error al cargar staff', err as Error)
      setError('Error al cargar la lista de usuarios staff')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsCreating(true)

    try {
      // Validaciones
      if (!newStaffName || !newStaffEmail || !newStaffPassword) {
        throw new Error('Todos los campos son requeridos')
      }

      if (!newStaffEmail.includes('@')) {
        throw new Error('Email inválido')
      }

      if (newStaffPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      const response = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al crear usuario staff')
      }

      setSuccess('Usuario staff creado exitosamente')
      setShowCreateDialog(false)
      setNewStaffName('')
      setNewStaffEmail('')
      setNewStaffPassword('')
      
      // Recargar lista
      await loadStaff()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear usuario staff'
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteStaff = async (staffId: string, staffEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${staffEmail}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/auth/staff/${staffId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar usuario staff')
      }

      setSuccess('Usuario staff eliminado exitosamente')
      await loadStaff()
    } catch (err) {
      setError('Error al eliminar usuario staff')
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
        throw new Error('Error al actualizar estado')
      }

      setSuccess(`Usuario ${!currentActive ? 'activado' : 'desactivado'} exitosamente`)
      await loadStaff()
    } catch (err) {
      setError('Error al actualizar estado del usuario')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Staff</h2>
          <p className="text-muted-foreground">
            Administra los usuarios de tu equipo
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario Staff</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario con acceso restringido para tu equipo
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                  Crear Usuario
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mensajes */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && !showCreateDialog && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla de Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Staff</CardTitle>
          <CardDescription>
            Lista de usuarios con acceso restringido creados por ti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay usuarios staff creados todavía</p>
              <p className="text-sm mt-2">
                Click en "Crear Staff" para agregar tu primer usuario
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(staff.id, staff.active)}
                        >
                          {staff.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
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
