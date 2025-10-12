"use client"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff"
  active: boolean
  createdAt: Date
  lastLogin?: Date
}

const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@admin.com",
    role: "admin",
    active: true,
    createdAt: new Date("2024-01-15"),
    lastLogin: new Date(),
  },
  {
    id: "2",
    name: "Personal",
    email: "staff@staff.com",
    role: "staff",
    active: true,
    createdAt: new Date("2024-01-20"),
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "3",
    name: "María García",
    email: "maria@restaurante.com",
    role: "staff",
    active: true,
    createdAt: new Date("2024-02-01"),
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    name: "Juan Pérez",
    email: "juan@restaurante.com",
    role: "staff",
    active: false,
    createdAt: new Date("2024-01-10"),
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
]

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff" as "admin" | "staff",
    active: true,
  })
  const { toast } = useToast()

  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
    }

    setUsers([...users, newUser])
    setIsDialogOpen(false)
    resetForm()

    toast({
      title: "Usuario creado",
      description: `Usuario ${newUser.name} creado exitosamente`,
    })
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    })
    setIsDialogOpen(true)
  }

  const handleUpdateUser = () => {
    if (!editingUser) return

    setUsers(
      users.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              ...formData,
            }
          : user,
      ),
    )

    setIsDialogOpen(false)
    setEditingUser(null)
    resetForm()

    toast({
      title: "Usuario actualizado",
      description: `Usuario ${formData.name} actualizado exitosamente`,
    })
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
    toast({
      title: "Usuario eliminado",
      description: "Usuario eliminado exitosamente",
    })
  }

  const handleToggleActive = (userId: string, active: boolean) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, active } : user)))
    toast({
      title: active ? "Usuario activado" : "Usuario desactivado",
      description: `El usuario ha sido ${active ? "activado" : "desactivado"}`,
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "staff",
      active: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getLastLoginText = (lastLogin?: Date) => {
    if (!lastLogin) return "Nunca"

    const now = new Date()
    const diffMs = now.getTime() - lastLogin.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return "Hace menos de 1 hora"
    if (diffHours < 24) return `Hace ${diffHours} horas`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} días`
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
              <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Completa los datos para crear un nuevo usuario"}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "staff") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                {editingUser ? "Actualizar" : "Crear"}
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
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{users.length}</div>
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
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{users.filter((u) => u.active).length}</div>
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
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{users.filter((u) => u.role === "admin").length}</div>
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
            <div className="text-2xl font-light tracking-tight dark:text-zinc-100">{users.filter((u) => u.role === "staff").length}</div>
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
                      {user.role === "admin" ? "Administrador" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.active}
                        onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                        size="sm"
                      />
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getLastLoginText(user.lastLogin)}</TableCell>
                  <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === "admin" && users.filter((u) => u.role === "admin").length === 1}
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
    </div>
  )
}
