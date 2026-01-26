import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingBag, TrendingUp, Package, Trophy, BarChart3 } from "lucide-react"
import Link from "next/link"

interface ProductItem {
  name: string
  quantity: number
}

interface ProductStats {
  name: string
  totalQuantity: number
  purchaseCount: number
}

function parseProducts(produit_achete: string | null, quantite: number | null): ProductItem[] {
  if (!produit_achete) return []
  
  try {
    const parsed = JSON.parse(produit_achete)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    // Not JSON, use old format
  }
  
  return [{ name: produit_achete, quantity: quantite || 1 }]
}

export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { data: customers } = await supabase.from("customers").select("*")
    const { data: resources } = await supabase.from("ressources_clients").select("*")

    const totalCustomers = customers?.length || 0
    const totalResources = resources?.length || 0

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const customersThisMonth =
      customers?.filter((c) => {
        if (!c.created_at) return false
        return new Date(c.created_at) >= firstDayOfMonth
      }).length || 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentPurchases =
      customers?.filter((c) => {
        if (!c.date_achat) return false
        return new Date(c.date_achat) >= thirtyDaysAgo
      }).length || 0

    const recentCustomers = customers?.slice(0, 5) || []

    // Calculate product statistics
    const productStatsMap = new Map<string, ProductStats>()
    
    customers?.forEach((customer) => {
      const products = parseProducts(customer.produit_achete, customer.quantite)
      products.forEach((product) => {
        if (product.name?.trim()) {
          const key = product.name.trim().toLowerCase()
          const existing = productStatsMap.get(key)
          if (existing) {
            existing.totalQuantity += product.quantity
            existing.purchaseCount += 1
          } else {
            productStatsMap.set(key, {
              name: product.name.trim(),
              totalQuantity: product.quantity,
              purchaseCount: 1,
            })
          }
        }
      })
    })

    const productStats = Array.from(productStatsMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
    
    const topProduct = productStats[0] || null
    const topProducts = productStats.slice(0, 5)
    const totalProductsSold = productStats.reduce((acc, p) => acc + p.totalQuantity, 0)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Clients enregistrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Ressources</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Ressources enregistrées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Nouveaux ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{customersThisMonth}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Clients ajoutés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Achats récents</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{recentPurchases}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">30 derniers jours</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Product Highlight */}
        {topProduct && (
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Produit le plus vendu</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Meilleur performeur de votre boutique</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{topProduct.name}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantité vendue</p>
                      <p className="text-xl font-semibold">{topProduct.totalQuantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre d'achats</p>
                      <p className="text-xl font-semibold">{topProduct.purchaseCount}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total produits vendus</p>
                  <p className="text-2xl font-bold">{totalProductsSold}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Statistics */}
        {topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">Top 5 Produits</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Classement par quantité vendue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => {
                  const maxQuantity = topProducts[0].totalQuantity
                  const percentage = (product.totalQuantity / maxQuantity) * 100
                  return (
                    <div key={product.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            index === 0 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium truncate max-w-[150px] sm:max-w-[250px]">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-muted-foreground text-xs hidden sm:inline">
                            {product.purchaseCount} achat{product.purchaseCount > 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold">{product.totalQuantity}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            index === 0 ? 'bg-primary' : 'bg-primary/60'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Clients récents</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Les 5 derniers clients ajoutés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun client pour le moment</p>
                ) : (
                  recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 gap-2"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none truncate">
                          {customer.prenom} {customer.nom}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {customer.email || customer.telephone || "-"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{customer.produit_achete || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.date_achat
                            ? new Date(customer.date_achat).toLocaleDateString("fr-FR")
                            : "Pas de date"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Liens rapides</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Accès rapide aux fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/customers" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                  <Users className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Voir tous les clients</span>
                </Button>
              </Link>
              <Link href="/dashboard/resources" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                  <Package className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Voir toutes les ressources</span>
                </Button>
              </Link>
              <a
                href="https://noorshop-bamako.myshopify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                  <ShoppingBag className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Boutique Shopify</span>
                </Button>
              </a>
              <a
                href="https://www.tiktok.com/@noorshopkidsmali1"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  <span className="truncate">TikTok</span>
                </Button>
              </a>
              <a
                href="https://www.facebook.com/people/Noorshop-Beaut%C3%A9-Enfant-Maison/61580601201096/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="truncate">Facebook</span>
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Dashboard page error:", error)
    redirect("/login")
  }
}
