"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
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
import { Plus, Search, Pencil, Trash2, Check, ChevronsUpDown } from "lucide-react"
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

interface CustomerFormData {
  client_id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string
  produit_achete: string
  quantite: number
  date_achat: string
  statut_client: string
  commentaire: string
}

// Form fields component to avoid duplication
const FormFields = ({
  isEdit = false,
  formData,
  setFormData,
  handleInputChange,
  handleSelectChange,
  handleProductChange,
  existingProducts
}: {
  isEdit?: boolean
  formData: CustomerFormData
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (name: string, value: string) => void
  handleProductChange: (value: string) => void
  existingProducts: string[]
}) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_client_id" : "client_id"}>ID Client (modifiable)</Label>
        <Input
          id={isEdit ? "edit_client_id" : "client_id"}
          name="client_id"
          value={formData.client_id}
          onChange={handleInputChange}
          placeholder="CLT-001"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_nom" : "nom"}>Nom</Label>
        <Input id={isEdit ? "edit_nom" : "nom"} name="nom" value={formData.nom} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_prenom" : "prenom"}>Prénom</Label>
        <Input id={isEdit ? "edit_prenom" : "prenom"} name="prenom" value={formData.prenom} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_telephone" : "telephone"}>Téléphone</Label>
        <Input id={isEdit ? "edit_telephone" : "telephone"} name="telephone" value={formData.telephone} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_date_achat" : "date_achat"}>Date d'achat</Label>
        <Input
          id={isEdit ? "edit_date_achat" : "date_achat"}
          name="date_achat"
          type="date"
          value={formData.date_achat}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit_statut_client" : "statut_client"}>Statut du client</Label>
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={isEdit ? "edit_adresse" : "adresse"}>Adresse</Label>
        <Input id={isEdit ? "edit_adresse" : "adresse"} name="adresse" value={formData.adresse} onChange={handleInputChange} />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={isEdit ? "edit_produit_achete" : "produit_achete"}>Produit acheté</Label>
      <div className="flex gap-2 items-start">
        <div className="w-20 shrink-0">
          <Input
            id={isEdit ? "edit_quantite" : "quantite"}
            name="quantite"
            type="number"
            min="1"
            value={formData.quantite}
            onChange={(e) => setFormData({ ...formData, quantite: Math.max(1, parseInt(e.target.value) || 1) })}
            className="text-center"
          />
          <p className="text-xs text-muted-foreground text-center mt-1">Qté</p>
        </div>
        <div className="flex-1">
          <ProductCombobox
            value={formData.produit_achete}
            onChange={handleProductChange}
            existingProducts={existingProducts}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Sélectionnez un produit existant ou tapez pour en créer un nouveau
          </p>
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={isEdit ? "edit_commentaire" : "commentaire"}>Commentaire</Label>
      <Textarea
        id={isEdit ? "edit_commentaire" : "commentaire"}
        name="commentaire"
        value={formData.commentaire}
        onChange={handleInputChange}
        rows={3}
      />
    </div>
  </>
)

// Product Combobox Component with create functionality
function ProductCombobox({
  value,
  onChange,
  existingProducts,
}: {
  value: string
  onChange: (value: string) => void
  existingProducts: string[]
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredProducts = useMemo(() => {
    if (!inputValue) return existingProducts
    return existingProducts.filter((product) =>
      product.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [existingProducts, inputValue])

  const isNewProduct = useMemo(() => {
    if (!inputValue.trim()) return false
    return !existingProducts.some(
      (product) => product.toLowerCase() === inputValue.trim().toLowerCase()
    )
  }, [existingProducts, inputValue])

  const handleSelect = (product: string) => {
    onChange(product)
    setInputValue(product)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange(e.target.value)
  }

  const handleAddNew = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim())
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Sélectionner ou créer un produit..."
          className="pr-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-2"
          onClick={() => setOpen(!open)}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-60 overflow-y-auto"
        >
          {filteredProducts.length === 0 && !isNewProduct ? (
            <div className="py-2 px-3 text-sm text-muted-foreground">
              Aucun produit trouvé. Tapez pour créer.
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => (
                <button
                  key={product}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent text-left"
                  onClick={() => handleSelect(product)}
                >
                  <Check
                    className={`h-4 w-4 ${
                      value.toLowerCase() === product.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  {product}
                </button>
              ))}
              {isNewProduct && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent text-left border-t mt-1 pt-2 text-primary font-medium"
                  onClick={handleAddNew}
                >
                  <Plus className="h-4 w-4" />
                  Créer "{inputValue.trim()}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    client_id: "",
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    produit_achete: "",
    quantite: 1,
    date_achat: "",
    statut_client: "",
    commentaire: "",
  })
  const router = useRouter()

  // Extract unique products from all customers (case-insensitive deduplication)
  const existingProducts = useMemo(() => {
    const productMap = new Map<string, string>()
    customers.forEach((customer) => {
      if (customer.produit_achete?.trim()) {
        const lowerCase = customer.produit_achete.trim().toLowerCase()
        if (!productMap.has(lowerCase)) {
          productMap.set(lowerCase, customer.produit_achete.trim())
        }
      }
    })
    return Array.from(productMap.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }, [customers])

  const generateNextClientId = () => {
    if (customers.length === 0) {
      return "CLT-001"
    }

    const clientIds = customers
      .map((c) => c.client_id)
      .filter((id) => id && id.startsWith("CLT-"))
      .map((id) => {
        const num = Number.parseInt(id!.split("-")[1])
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
        customer.client_id?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [customers, searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleProductChange = (value: string) => {
    setFormData({ ...formData, produit_achete: value })
  }

  const resetForm = () => {
    const nextClientId = generateNextClientId()
    setFormData({
      client_id: nextClientId,
      nom: "",
      prenom: "",
      telephone: "",
      adresse: "",
      produit_achete: "",
      quantite: 1,
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
      console.error("Error adding customer:", error)
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
      console.error("Error updating customer:", error)
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
      console.error("Error deleting customer:", error)
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
      adresse: customer.adresse || "",
      produit_achete: customer.produit_achete || "",
      quantite: customer.quantite || 1,
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
              <FormFields
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                handleProductChange={handleProductChange}
                existingProducts={existingProducts}
              />
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
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
                    <TableCell>{customer.adresse || "-"}</TableCell>
                    <TableCell>
                      {customer.produit_achete
                        ? `${customer.quantite || 1} x ${customer.produit_achete}`
                        : "-"}
                    </TableCell>
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
                              <FormFields
                                isEdit
                                formData={formData}
                                setFormData={setFormData}
                                handleInputChange={handleInputChange}
                                handleSelectChange={handleSelectChange}
                                handleProductChange={handleProductChange}
                                existingProducts={existingProducts}
                              />
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
                          <FormFields
                            isEdit
                            formData={formData}
                            setFormData={setFormData}
                            handleInputChange={handleInputChange}
                            handleSelectChange={handleSelectChange}
                            handleProductChange={handleProductChange}
                            existingProducts={existingProducts}
                          />
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
                    <div className="text-xs text-muted-foreground">Statut</div>
                    <div className="truncate">
                      {customer.statut_client
                        ? STATUS_OPTIONS.find((opt) => opt.value === customer.statut_client)?.label ||
                          customer.statut_client
                        : "-"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Produit</div>
                    <div className="truncate">
                      {customer.produit_achete
                        ? `${customer.quantite || 1} x ${customer.produit_achete}`
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
