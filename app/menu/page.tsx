"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMenuItems, useMenuCategories } from "@/hooks/use-menu"
import { MenuItemDialog } from "@/components/menu-item-dialog"
import { MenuCategoryDialog } from "@/components/menu-category-dialog"
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

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Use hooks
  const { items, loading: itemsLoading, createItem, updateItem, deleteItem, refresh: refreshItems } = useMenuItems()
  const { categories, loading: categoriesLoading, createCategory, updateCategory, refresh: refreshCategories } = useMenuCategories()
  
  // Dialog states
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isLoading = itemsLoading || categoriesLoading

  // Handlers for items
  const handleAddItem = () => {
    setEditingItem(null)
    setShowItemDialog(true)
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setShowItemDialog(true)
  }

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteItem(itemToDelete.id)
      toast({
        title: "Item eliminado",
        description: `"${itemToDelete.name}" fue eliminado exitosamente.`,
      })
      setItemToDelete(null)
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "Error al eliminar item",
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveItem = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data)
    } else {
      await createItem(data)
    }
  }

  // Handlers for categories
  const handleAddCategory = () => {
    setEditingCategory(null)
    setShowCategoryDialog(true)
  }

  const handleSaveCategory = async (data: any) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data)
    } else {
      await createCategory(data)
    }
  }

  const handleRefresh = () => {
    refreshItems()
    refreshCategories()
    toast({
      title: "Menú actualizado",
      description: "Los datos del menú se han actualizado correctamente.",
    })
  }

  const filteredItems = selectedCategory
    ? items.filter((item: any) => item.categoryId === selectedCategory)
    : items

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
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
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
                    Todas ({items.length})
                  </Button>
                  {categories.map((category: any) => {
                    const itemCount = items.filter(
                      (item: any) => item.categoryId === category.id
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
                  {filteredItems.map((item: any) => (
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
                          <p className="text-2xl font-light">{formatPrice(item.price_cents || item.priceCents)}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag: string, idx: number) => (
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

      {/* Menu Item Dialog */}
      <MenuItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        item={editingItem}
        categories={categories}
        onSave={handleSaveItem}
      />

      {/* Category Dialog */}
      <MenuCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar "{itemToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El item será eliminado permanentemente del menú.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
