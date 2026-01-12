"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Resource } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PRODUCT_TYPES = ["Beauté Enfant", "Produits Maison", "Vêtements", "Jouets", "Accessoires", "Autre"]

export function ResourcesTable() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    resource_id: "",
    nom: "",
    prenom: "",
    telephone: "",
    produit: "",
    commentaire: "",
  })

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    const filtered = resources.filter(
      (resource) =>
        resource.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredResources(filtered)
  }, [searchTerm, resources])

  const fetchResources = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ressources_clients")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setResources(data || [])
      setFilteredResources(data || [])
    } catch (error) {
      console.error("Error fetching resources:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les ressources",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateNextResourceId = () => {
    if (resources.length === 0) return "RES-001"

    const ids = resources
      .map((r) => r.resource_id)
      .filter((id): id is string => id !== null)
      .map((id) => {
        const match = id.match(/RES-(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      })

    const maxId = Math.max(...ids, 0)
    const nextId = maxId + 1
    return `RES-${nextId.toString().padStart(3, "0")}`
  }

  const handleAdd = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("ressources_clients").insert([
        {
          ...formData,
          user_id: user.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Ressource ajoutée avec succès",
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchResources()
    } catch (error) {
      console.error("Error adding resource:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ressource",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!editingResource) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("ressources_clients").update(formData).eq("id", editingResource.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Ressource modifiée avec succès",
      })

      setIsEditDialogOpen(false)
      setEditingResource(null)
      resetForm()
      fetchResources()
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier la ressource",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("ressources_clients").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Ressource supprimée avec succès",
      })

      fetchResources()
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ressource",
        variant: "destructive",
      })
    }
  }

  const openAddDialog = () => {
    resetForm()
    setFormData((prev) => ({ ...prev, resource_id: generateNextResourceId() }))
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      resource_id: resource.resource_id || "",
      nom: resource.nom || "",
      prenom: resource.prenom || "",
      telephone: resource.telephone || "",
      produit: resource.produit || "",
      commentaire: resource.commentaire || "",
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      resource_id: "",
      nom: "",
      prenom: "",
      telephone: "",
      produit: "",
      commentaire: "",
    })
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une ressource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ressource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une ressource</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resource_id">Référence</Label>
                <Input
                  id="resource_id"
                  value={formData.resource_id}
                  onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                  placeholder="RES-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="produit">Produit</Label>
                <Select
                  value={formData.produit}
                  onValueChange={(value) => setFormData({ ...formData, produit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commentaire">Commentaire</Label>
                <Textarea
                  id="commentaire"
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAdd}>Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        {/* Desktop table view */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune ressource trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.resource_id}</TableCell>
                    <TableCell>{resource.nom}</TableCell>
                    <TableCell>{resource.prenom}</TableCell>
                    <TableCell>{resource.telephone}</TableCell>
                    <TableCell>{resource.produit}</TableCell>
                    <TableCell className="max-w-xs truncate">{resource.commentaire}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="lg:hidden divide-y">
          {filteredResources.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aucune ressource trouvée</div>
          ) : (
            filteredResources.map((resource) => (
              <div key={resource.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {resource.prenom} {resource.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">{resource.resource_id}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(resource)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(resource.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Téléphone</div>
                    <div className="truncate">{resource.telephone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Produit</div>
                    <div className="truncate">{resource.produit}</div>
                  </div>
                </div>
                {resource.commentaire && (
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Commentaire</div>
                    <div className="line-clamp-2 text-xs">{resource.commentaire}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la ressource</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_resource_id">Référence</Label>
              <Input
                id="edit_resource_id"
                value={formData.resource_id}
                onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_nom">Nom</Label>
                <Input
                  id="edit_nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_prenom">Prénom</Label>
                <Input
                  id="edit_prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_telephone">Téléphone</Label>
              <Input
                id="edit_telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_produit">Produit</Label>
              <Select value={formData.produit} onValueChange={(value) => setFormData({ ...formData, produit: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_commentaire">Commentaire</Label>
              <Textarea
                id="edit_commentaire"
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
