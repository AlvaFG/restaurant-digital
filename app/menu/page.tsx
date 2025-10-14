"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { MenuCategory, MenuItem } from "@/lib/mock-data"

interface MenuResponse {
  categories: MenuCategory[]
  items: MenuItem[]
}

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()

  const loadMenu = async () => {
    const wasLoading = isLoading
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar el menú')
      
      const data = await response.json()
      setMenuData({
        categories: data.data.categories || [],
        items: data.data.items || [],
      })
      
      if (!wasLoading) {
        toast({
          title: "Menú actualizado",
          description: "Los datos del menú se han cargado correctamente",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        title: "Error",
        description: "No se pudo cargar el menú",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMenu()
  }, [])

  const handleEditItem = (item: MenuItem) => {
    toast({
      title: "Editar item",
      description: `Funcionalidad en desarrollo: ${item.name}`,
    })
    console.log('Editar item:', item)
  }

  const handleDeleteItem = (item: MenuItem) => {
    toast({
      title: "Eliminar item",
      description: `Funcionalidad en desarrollo: ${item.name}`,
      variant: "destructive",
    })
    console.log('Eliminar item:', item)
  }

  const handleAddItem = () => {
    toast({
      title: "Agregar item",
      description: "Funcionalidad en desarrollo",
    })
    console.log('Agregar nuevo item')
  }

  const handleAddCategory = () => {
    toast({
      title: "Nueva categoría",
      description: "Funcionalidad en desarrollo",
    })
    console.log('Agregar nueva categoría')
  }

  const filteredItems = selectedCategory
    ? (menuData?.items.filter(item => item.categoryId === selectedCategory) || [])
    : (menuData?.items || [])

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(cents / 100)
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Menú</h1>
            <p className="text-muted-foreground font-light">Gestión del menú del restaurante</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadMenu} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadMenu} variant="outline" className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-light">Categorías</CardTitle>
                  <CardDescription className="font-light">
                    Filtra por categoría
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas ({menuData?.items.length || 0})
                  </Button>
                  {menuData?.categories.map((category) => {
                    const itemCount = menuData.items.filter(
                      item => item.categoryId === category.id
                    ).length
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "ghost"}
                        className="w-full justify-between"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <span>{category.name}</span>
                        <Badge variant="outline">{itemCount}</Badge>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-light">Gestión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleAddCategory}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Categoría
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground font-light">
                      No hay items en esta categoría
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleAddItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar primer item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-light">{item.name}</CardTitle>
                            <CardDescription className="font-light line-clamp-2">
                              {item.description}
                            </CardDescription>
                          </div>
                          <Badge variant={item.available ? "default" : "secondary"}>
                            {item.available ? "Disponible" : "No disponible"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <p className="text-2xl font-light">{formatPrice(item.priceCents)}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
