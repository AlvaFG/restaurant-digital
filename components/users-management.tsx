"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import { useUsers, useUserStats, useCreateUser, useUpdateUser, useToggleUserActive, useDeleteUser, type User } from "@/hooks/use-users"
import { LoadingSpinner } from "@/components/loading-spinner"

export function UsersManagement() {
  const tCommon = useTranslations('common')
  
  // Hooks for Supabase operations
  const { data: users = [], isLoading, error } = useUsers()
  const { data: stats } = useUserStats()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const toggleActiveMutation = useToggleUserActive()
  const deleteUserMutation = useDeleteUser()

  // Local state for UI
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [userToToggle, setUserToToggle] = useState<{userId: string, newActive: boolean, userName: string} | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff" as "admin" | "staff" | "manager",
    active: true,
  })

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      return
    }

    await createUserMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      active: formData.active,
    })

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't populate password
      role: user.role,
      active: user.active,
    })
    setIsDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    await updateUserMutation.mutateAsync({
      userId: editingUser.id,
      input: {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      },
    })

    setIsDialogOpen(false)
    setEditingUser(null)
    resetForm()
  }

  const handleDeleteUser = async () => {
    if (!deletingUserId) return

    await deleteUserMutation.mutateAsync(deletingUserId)
    setDeletingUserId(null)
  }

  const handleToggleActive = async (userId: string, newActive: boolean, userName: string) => {
    // Si está activando, no pedir confirmación
    if (newActive) {
      await toggleActiveMutation.mutateAsync({ userId, active: newActive })
      return
    }
    
    // Si está desactivando, pedir confirmación
    setUserToToggle({ userId, newActive, userName })
  }

  const confirmToggleActive = async () => {
    if (!userToToggle) return
    
    await toggleActiveMutation.mutateAsync({ 
      userId: userToToggle.userId, 
      active: userToToggle.newActive 
    })
    setUserToToggle(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "staff",
      active: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getLastLoginText = (lastLogin?: string | null) => {
    if (!lastLogin) return "Nunca"

    const date = new Date(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return "Hace menos de 1 hora"
    if (diffHours < 24) return `Hace ${diffHours} horas`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} días`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error al cargar usuarios</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground font-light">Administra usuarios y roles del sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? tCommon('editUser') : tCommon('createNewUser')}</DialogTitle>
              <DialogDescription>
                {editingUser ? tCommon('editUserDescription') : tCommon('createUserDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@restaurante.com"
                  required
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "staff" | "manager") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">{tCommon('staff')}</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Usuario Activo</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                Cancelar
              </Button>
              <Button 
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={createUserMutation.isPending || updateUserMutation.isPending || !formData.name || !formData.email || (!editingUser && !formData.password)}
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) && <LoadingSpinner />}
                {editingUser ? tCommon('update') : tCommon('create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">Total Usuarios</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 border-2 border-primary/30 dark:bg-zinc-800 dark:border-zinc-600">
              <Users className="h-4 w-4 text-primary dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{stats?.total || users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">Usuarios Activos</CardTitle>
            <div className="rounded-full bg-chart-2/10 p-2 border-2 border-chart-2/30 dark:bg-zinc-800 dark:border-zinc-600">
              <Users className="h-4 w-4 text-chart-2 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{stats?.active || users.filter((u: any) => u.active).length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">Administradores</CardTitle>
            <div className="rounded-full bg-chart-3/10 p-2 border-2 border-chart-3/30 dark:bg-zinc-800 dark:border-zinc-600">
              <Users className="h-4 w-4 text-chart-3 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{stats?.admins || users.filter((u: any) => u.role === "admin" && u.active).length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:hover:shadow-zinc-900/50 dark:hover:border-zinc-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground dark:text-zinc-400">Staff</CardTitle>
            <div className="rounded-full bg-chart-4/10 p-2 border-2 border-chart-4/30 dark:bg-zinc-800 dark:border-zinc-600">
              <Users className="h-4 w-4 text-chart-4 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{stats?.staff || users.filter((u: any) => u.role === "staff" && u.active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-2 border-border shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl">
        <CardHeader className="border-b dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardTitle className="font-light dark:text-zinc-100">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : user.role === "manager" ? "Manager" : tCommon('staff')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.active}
                        onCheckedChange={(checked) => handleToggleActive(user.id, checked, user.name)}
                        disabled={toggleActiveMutation.isPending}
                      />
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? tCommon('active') : tCommon('inactive')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getLastLoginText(user.last_login_at)}</TableCell>
                  <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUserId(user.id)}
                        disabled={user.role === "admin" && users.filter((u: any) => u.role === "admin" && u.active).length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será desactivado y no podrá acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>{tCommon('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation Dialog (only for deactivation) */}
      <AlertDialog open={!!userToToggle && !userToToggle.newActive} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar usuario "{userToToggle?.userName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuario no podrá acceder al sistema hasta que lo reactives.
              Las sesiones activas se cerrarán automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleActiveMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleActive}
              disabled={toggleActiveMutation.isPending}
            >
              {toggleActiveMutation.isPending ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
