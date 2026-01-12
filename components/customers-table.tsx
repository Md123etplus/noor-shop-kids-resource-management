"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import type { Customer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

const STATUS_OPTIONS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "vip", label: "VIP" },
  { value: "en_attente", label: "En attente" },
]

interface CustomersTableProps {
  initialCustomers: Customer[]
}

export function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    client_id: "",
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    produit_achete: "",
    date_achat: "",
    statut_client: "",
    commentaire: "",
  })
  const router = useRouter()

  const generateNextClientId = () => {
    if (customers.length === 0) {
      return "CLT-001"
    }

    // Find the highest client ID number
    const clientIds = customers
      .map((c) => c.client_id)
      .filter((id) => id && id.startsWith("CLT-"))
      .map((id) => {
        const num = Number.parseInt(id.split("-")[1])
        return isNaN(num) ? 0 : num
      })

    const maxId = Math.max(0, ...clientIds)
    const nextId = maxId + 1
    return `CLT-${String(nextId).padStart(3, "0")}`
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.telephone?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.client_id?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [customers, searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    const nextClientId = generateNextClientId()
    setFormData({
      client_id: nextClientId,
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      produit_achete: "",
      date_achat: "",
      statut_client: "",
      commentaire: "",
    })
    setEditingCustomer(null)
  }

  useEffect(() => {
    if (isAddDialogOpen && !editingCustomer) {
      const nextClientId = generateNextClientId()
      setFormData((prev) => ({ ...prev, client_id: nextClientId }))
    }
  }, [isAddDialogOpen, editingCustomer])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("customers")
      .insert([{ ...formData, user_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding customer:", error)
      return
    }

    setCustomers([data, ...customers])
    setIsAddDialogOpen(false)
    resetForm()
    router.refresh()
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCustomer) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("customers")
      .update(formData)
      .eq("id", editingCustomer.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating customer:", error)
      return
    }

    setCustomers(customers.map((c) => (c.id === data.id ? data : c)))
    setEditingCustomer(null)
    resetForm()
    router.refresh()
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client?")) return

    const supabase = createClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting customer:", error)
      return
    }

    setCustomers(customers.filter((c) => c.id !== id))
    router.refresh()
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      client_id: customer.client_id || "",
      nom: customer.nom || "",
      prenom: customer.prenom || "",
      telephone: customer.telephone || "",
      email: customer.email || "",
      adresse: customer.adresse || "",
      produit_achete: customer.produit_achete || "",
      date_achat: customer.date_achat || "",
      statut_client: customer.statut_client || "",
      commentaire: customer.commentaire || "",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau client</DialogTitle>
              <DialogDescription>Remplissez les informations du client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">ID Client (modifiable)</Label>
                  <Input
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    placeholder="CLT-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" name="nom" value={formData.nom} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" name="prenom" value={formData.prenom} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_achat">Date d'achat</Label>
                  <Input
                    id="date_achat"
                    name="date_achat"
                    type="date"
                    value={formData.date_achat}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut_client">Statut du client</Label>
                  <Select
                    value={formData.statut_client}
                    onValueChange={(value) => handleSelectChange("statut_client", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input id="adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="produit_achete">Produit acheté</Label>
                <Input
                  id="produit_achete"
                  name="produit_achete"
                  value={formData.produit_achete}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commentaire">Commentaire</Label>
                <Textarea
                  id="commentaire"
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Ajouter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        {/* Desktop table view */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Client</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Produit acheté</TableHead>
                <TableHead>Date d'achat</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Aucun client trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.client_id || "-"}</TableCell>
                    <TableCell>{customer.nom || "-"}</TableCell>
                    <TableCell>{customer.prenom || "-"}</TableCell>
                    <TableCell>{customer.telephone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.adresse || "-"}</TableCell>
                    <TableCell>{customer.produit_achete || "-"}</TableCell>
                    <TableCell>{customer.date_achat || "-"}</TableCell>
                    <TableCell>
                      {customer.statut_client
                        ? STATUS_OPTIONS.find((opt) => opt.value === customer.statut_client)?.label ||
                          customer.statut_client
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{customer.commentaire || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={editingCustomer?.id === customer.id}
                          onOpenChange={(open) => !open && setEditingCustomer(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Modifier le client</DialogTitle>
                              <DialogDescription>Modifiez les informations du client</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateCustomer} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit_client_id">ID Client (modifiable)</Label>
                                  <Input
                                    id="edit_client_id"
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_nom">Nom</Label>
                                  <Input id="edit_nom" name="nom" value={formData.nom} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_prenom">Prénom</Label>
                                  <Input
                                    id="edit_prenom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_telephone">Téléphone</Label>
                                  <Input
                                    id="edit_telephone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_email">Email</Label>
                                  <Input
                                    id="edit_email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_date_achat">Date d'achat</Label>
                                  <Input
                                    id="edit_date_achat"
                                    name="date_achat"
                                    type="date"
                                    value={formData.date_achat}
                                    onChange={handleInputChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_statut_client">Statut du client</Label>
                                  <Select
                                    value={formData.statut_client}
                                    onValueChange={(value) => handleSelectChange("statut_client", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_adresse">Adresse</Label>
                                  <Input
                                    id="edit_adresse"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit_produit_achete">Produit acheté</Label>
                                <Input
                                  id="edit_produit_achete"
                                  name="produit_achete"
                                  value={formData.produit_achete}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit_commentaire">Commentaire</Label>
                                <Textarea
                                  id="edit_commentaire"
                                  name="commentaire"
                                  value={formData.commentaire}
                                  onChange={handleInputChange}
                                  rows={3}
                                />
                              </div>
                              <Button type="submit" className="w-full">
                                Mettre à jour
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
          {filteredCustomers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aucun client trouvé</div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {customer.prenom} {customer.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">{customer.client_id || "-"}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Dialog
                      open={editingCustomer?.id === customer.id}
                      onOpenChange={(open) => !open && setEditingCustomer(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Modifier le client</DialogTitle>
                          <DialogDescription>Modifiez les informations du client</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateCustomer} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit_client_id">ID Client (modifiable)</Label>
                              <Input
                                id="edit_client_id"
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_nom">Nom</Label>
                              <Input id="edit_nom" name="nom" value={formData.nom} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_prenom">Prénom</Label>
                              <Input
                                id="edit_prenom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_telephone">Téléphone</Label>
                              <Input
                                id="edit_telephone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_email">Email</Label>
                              <Input
                                id="edit_email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_date_achat">Date d'achat</Label>
                              <Input
                                id="edit_date_achat"
                                name="date_achat"
                                type="date"
                                value={formData.date_achat}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_statut_client">Statut du client</Label>
                              <Select
                                value={formData.statut_client}
                                onValueChange={(value) => handleSelectChange("statut_client", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit_adresse">Adresse</Label>
                              <Input
                                id="edit_adresse"
                                name="adresse"
                                value={formData.adresse}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit_produit_achete">Produit acheté</Label>
                            <Input
                              id="edit_produit_achete"
                              name="produit_achete"
                              value={formData.produit_achete}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit_commentaire">Commentaire</Label>
                            <Textarea
                              id="edit_commentaire"
                              name="commentaire"
                              value={formData.commentaire}
                              onChange={handleInputChange}
                              rows={3}
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Mettre à jour
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Téléphone</div>
                    <div className="truncate">{customer.telephone || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="truncate">{customer.email || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Produit</div>
                    <div className="truncate">{customer.produit_achete || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Statut</div>
                    <div className="truncate">
                      {customer.statut_client
                        ? STATUS_OPTIONS.find((opt) => opt.value === customer.statut_client)?.label ||
                          customer.statut_client
                        : "-"}
                    </div>
                  </div>
                </div>
                {customer.adresse && (
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Adresse</div>
                    <div className="truncate">{customer.adresse}</div>
                  </div>
                )}
                {customer.commentaire && (
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Commentaire</div>
                    <div className="line-clamp-2 text-xs">{customer.commentaire}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
