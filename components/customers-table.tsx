"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
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
import { Plus, Search, Pencil, Trash2, Check, ChevronsUpDown, X, Download, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

const STATUS_OPTIONS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "vip", label: "VIP" },
  { value: "en_attente", label: "En attente" },
]

interface ProductItem {
  name: string
  quantity: number
}

interface CustomersTableProps {
  initialCustomers: Customer[]
}

interface CustomerFormData {
  client_id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string
  products: ProductItem[]
  date_achat: string
  statut_client: string
  commentaire: string
}

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

  const handleInputChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
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
          onChange={handleInputChangeLocal}
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

// Product list component for adding multiple products
function ProductsList({
  products,
  onProductsChange,
  existingProducts,
}: {
  products: ProductItem[]
  onProductsChange: (products: ProductItem[]) => void
  existingProducts: string[]
}) {
  const handleProductNameChange = (index: number, name: string) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], name }
    onProductsChange(newProducts)
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], quantity: Math.max(1, quantity) }
    onProductsChange(newProducts)
  }

  const addProduct = () => {
    onProductsChange([...products, { name: "", quantity: 1 }])
  }

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      const newProducts = products.filter((_, i) => i !== index)
      onProductsChange(newProducts)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Produits achetés</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProduct}
          className="h-7 text-xs bg-transparent"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter produit
        </Button>
      </div>
      <div className="space-y-2">
        {products.map((product, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="w-16 shrink-0">
              <Input
                type="number"
                min="1"
                value={product.quantity}
                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                className="text-center h-9"
              />
              <p className="text-xs text-muted-foreground text-center mt-0.5">Qté</p>
            </div>
            <div className="flex-1">
              <ProductCombobox
                value={product.name}
                onChange={(value) => handleProductNameChange(index, value)}
                existingProducts={existingProducts}
              />
            </div>
            {products.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeProduct(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Sélectionnez un produit existant ou tapez pour en créer un nouveau
      </p>
    </div>
  )
}

// Export functions
function exportToCSV(customers: Customer[], formatProductsDisplay: (customer: Customer) => string) {
  const STATUS_LABELS: Record<string, string> = {
    nouveau: "Nouveau",
    actif: "Actif",
    inactif: "Inactif",
    vip: "VIP",
    en_attente: "En attente",
  }

  const headers = [
    "ID Client",
    "Nom",
    "Prénom",
    "Téléphone",
    "Adresse",
    "Produits achetés",
    "Date d'achat",
    "Statut",
    "Commentaire",
  ]

  const csvContent = [
    headers.join(";"),
    ...customers.map((c) => [
      c.client_id || "",
      c.nom || "",
      c.prenom || "",
      c.telephone || "",
      c.adresse || "",
      formatProductsDisplay(c).replace(/;/g, ","),
      c.date_achat || "",
      c.statut_client ? STATUS_LABELS[c.statut_client] || c.statut_client : "",
      (c.commentaire || "").replace(/;/g, ",").replace(/\n/g, " "),
    ].map(field => `"${field}"`).join(";"))
  ].join("\n")

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `clients_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportToPDF(customers: Customer[], formatProductsDisplay: (customer: Customer) => string) {
  const STATUS_LABELS: Record<string, string> = {
    nouveau: "Nouveau",
    actif: "Actif",
    inactif: "Inactif",
    vip: "VIP",
    en_attente: "En attente",
  }

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Veuillez autoriser les popups pour exporter en PDF")
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Liste des Clients - NoorShop Kids</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #6366f1; }
        .header h1 { color: #6366f1; font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 12px; }
        .stats { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
        .stat-label { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #6366f1; color: white; padding: 10px 6px; text-align: left; font-weight: 600; }
        td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) { background: #f9fafb; }
        .truncate { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        @media print {
          body { padding: 10px; }
          .header { margin-bottom: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>NoorShop Kids</h1>
        <p>Liste des Clients - Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${customers.length}</div>
          <div class="stat-label">Total Clients</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Téléphone</th>
            <th>Adresse</th>
            <th>Produits</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td>${c.client_id || "-"}</td>
              <td>${c.nom || "-"}</td>
              <td>${c.prenom || "-"}</td>
              <td>${c.telephone || "-"}</td>
              <td class="truncate" title="${c.adresse || ""}">${c.adresse || "-"}</td>
              <td class="truncate" title="${formatProductsDisplay(c)}">${formatProductsDisplay(c)}</td>
              <td>${c.date_achat || "-"}</td>
              <td>${c.statut_client ? STATUS_LABELS[c.statut_client] || c.statut_client : "-"}</td>
              <td class="truncate" title="${c.commentaire || ""}">${c.commentaire || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>NoorShop Kids - Gestion des Ressources</p>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    client_id: "",
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    products: [{ name: "", quantity: 1 }],
    date_achat: "",
    statut_client: "",
    commentaire: "",
  })
  const router = useRouter()

  // Parse products from customer data (supports both old format and new JSON format)
  const parseProducts = (customer: Customer): ProductItem[] => {
    if (!customer.produit_achete) return [{ name: "", quantity: 1 }]
    
    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(customer.produit_achete)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      // Not JSON, use old format
    }
    
    // Old format: single product with quantity
    return [{ name: customer.produit_achete, quantity: customer.quantite || 1 }]
  }

  // Format products for display
  const formatProductsDisplay = (customer: Customer): string => {
    const products = parseProducts(customer)
    if (products.length === 0 || (products.length === 1 && !products[0].name)) return "-"
    return products
      .filter(p => p.name)
      .map(p => `${p.quantity} x ${p.name}`)
      .join(", ")
  }

  // Extract unique products from all customers (case-insensitive deduplication)
  const existingProducts = useMemo(() => {
    const productMap = new Map<string, string>()
    customers.forEach((customer) => {
      const products = parseProducts(customer)
      products.forEach(product => {
        if (product.name?.trim()) {
          const lowerCase = product.name.trim().toLowerCase()
          if (!productMap.has(lowerCase)) {
            productMap.set(lowerCase, product.name.trim())
          }
        }
      })
    })
    return Array.from(productMap.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }, [customers])

  const generateNextClientId = useCallback(() => {
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
  }, [customers])

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.telephone?.includes(searchTerm) ||
        customer.client_id?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [customers, searchTerm])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleProductsChange = useCallback((products: ProductItem[]) => {
    setFormData(prev => ({ ...prev, products }))
  }, [])

  const resetForm = useCallback(() => {
    const nextClientId = generateNextClientId()
    setFormData({
      client_id: nextClientId,
      nom: "",
      prenom: "",
      telephone: "",
      adresse: "",
      products: [{ name: "", quantity: 1 }],
      date_achat: "",
      statut_client: "",
      commentaire: "",
    })
    setEditingCustomer(null)
  }, [generateNextClientId])

  useEffect(() => {
    if (isAddDialogOpen && !editingCustomer) {
      const nextClientId = generateNextClientId()
      setFormData((prev) => ({ ...prev, client_id: nextClientId }))
    }
  }, [isAddDialogOpen, editingCustomer, generateNextClientId])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] No user found")
        setIsSubmitting(false)
        return
      }

      // Filter out empty products and prepare data
      const validProducts = formData.products.filter(p => p.name.trim())
      const productData = validProducts.length > 0 ? JSON.stringify(validProducts) : null

      const insertData = {
        client_id: formData.client_id,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        adresse: formData.adresse,
        produit_achete: productData,
        quantite: validProducts.length > 0 ? validProducts[0].quantity : 1,
        date_achat: formData.date_achat || null,
        statut_client: formData.statut_client || null,
        commentaire: formData.commentaire,
        user_id: user.id
      }

      console.log("[v0] Inserting customer:", insertData)

      const { data, error } = await supabase
        .from("customers")
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.log("[v0] Error adding customer:", error)
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Customer added successfully:", data)
      setCustomers([data, ...customers])
      setIsAddDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.log("[v0] Exception:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !editingCustomer) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Filter out empty products and prepare data
      const validProducts = formData.products.filter(p => p.name.trim())
      const productData = validProducts.length > 0 ? JSON.stringify(validProducts) : null

      const updateData = {
        client_id: formData.client_id,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        adresse: formData.adresse,
        produit_achete: productData,
        quantite: validProducts.length > 0 ? validProducts[0].quantity : 1,
        date_achat: formData.date_achat || null,
        statut_client: formData.statut_client || null,
        commentaire: formData.commentaire,
      }

      console.log("[v0] Updating customer:", updateData)

      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", editingCustomer.id)
        .select()
        .single()

      if (error) {
        console.log("[v0] Error updating customer:", error)
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Customer updated successfully:", data)
      setCustomers(customers.map((c) => (c.id === data.id ? data : c)))
      setEditingCustomer(null)
      resetForm()
      router.refresh()
    } catch (err) {
      console.log("[v0] Exception:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client?")) return

    const supabase = createClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) {
      console.log("[v0] Error deleting customer:", error)
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
      products: parseProducts(customer),
      date_achat: customer.date_achat || "",
      statut_client: customer.statut_client || "",
      commentaire: customer.commentaire || "",
    })
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredCustomers, formatProductsDisplay)}
            className="flex-1 sm:flex-none bg-transparent"
            title="Exporter en CSV"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToPDF(filteredCustomers, formatProductsDisplay)}
            className="flex-1 sm:flex-none bg-transparent"
            title="Exporter en PDF"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau client</DialogTitle>
              <DialogDescription>Remplissez les informations du client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input id="adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} />
                </div>
              </div>
              <ProductsList
                products={formData.products}
                onProductsChange={handleProductsChange}
                existingProducts={existingProducts}
              />
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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
                <TableHead>Produits achetés</TableHead>
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
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={formatProductsDisplay(customer)}>
                        {formatProductsDisplay(customer)}
                      </div>
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit_client_id">ID Client (modifiable)</Label>
                                  <Input
                                    id="edit_client_id"
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleInputChange}
                                    placeholder="CLT-001"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_nom">Nom</Label>
                                  <Input id="edit_nom" name="nom" value={formData.nom} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_prenom">Prénom</Label>
                                  <Input id="edit_prenom" name="prenom" value={formData.prenom} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_telephone">Téléphone</Label>
                                  <Input id="edit_telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} />
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
                                <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="edit_adresse">Adresse</Label>
                                  <Input id="edit_adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} />
                                </div>
                              </div>
                              <ProductsList
                                products={formData.products}
                                onProductsChange={handleProductsChange}
                                existingProducts={existingProducts}
                              />
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
                              <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_client_id">ID Client (modifiable)</Label>
                              <Input
                                id="mobile_edit_client_id"
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleInputChange}
                                placeholder="CLT-001"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_nom">Nom</Label>
                              <Input id="mobile_edit_nom" name="nom" value={formData.nom} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_prenom">Prénom</Label>
                              <Input id="mobile_edit_prenom" name="prenom" value={formData.prenom} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_telephone">Téléphone</Label>
                              <Input id="mobile_edit_telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_date_achat">Date d'achat</Label>
                              <Input
                                id="mobile_edit_date_achat"
                                name="date_achat"
                                type="date"
                                value={formData.date_achat}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobile_edit_statut_client">Statut du client</Label>
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
                              <Label htmlFor="mobile_edit_adresse">Adresse</Label>
                              <Input id="mobile_edit_adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} />
                            </div>
                          </div>
                          <ProductsList
                            products={formData.products}
                            onProductsChange={handleProductsChange}
                            existingProducts={existingProducts}
                          />
                          <div className="space-y-2">
                            <Label htmlFor="mobile_edit_commentaire">Commentaire</Label>
                            <Textarea
                              id="mobile_edit_commentaire"
                              name="commentaire"
                              value={formData.commentaire}
                              onChange={handleInputChange}
                              rows={3}
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
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
                    <div className="text-xs text-muted-foreground">Produits</div>
                    <div className="truncate">{formatProductsDisplay(customer)}</div>
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
