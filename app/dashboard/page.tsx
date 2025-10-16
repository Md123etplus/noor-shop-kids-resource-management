import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingBag, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    // Fetch statistics
    const { data: customers } = await supabase.from("customers").select("*")

    const totalCustomers = customers?.length || 0

    // Calculate customers this month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const customersThisMonth =
      customers?.filter((c) => {
        if (!c.created_at) return false
        return new Date(c.created_at) >= firstDayOfMonth
      }).length || 0

    // Calculate recent purchases (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentPurchases =
      customers?.filter((c) => {
        if (!c.date_achat) return false
        return new Date(c.date_achat) >= thirtyDaysAgo
      }).length || 0

    // Get recent customers
    const recentCustomers = customers?.slice(0, 5) || []

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Clients enregistrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customersThisMonth}</div>
              <p className="text-xs text-muted-foreground">Clients ajoutés ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achats récents</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentPurchases}</div>
              <p className="text-xs text-muted-foreground">30 derniers jours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </div>
              <p className="text-xs text-muted-foreground">{now.getFullYear()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Clients récents</CardTitle>
              <CardDescription>Les 5 derniers clients ajoutés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun client pour le moment</p>
                ) : (
                  recentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {customer.prenom} {customer.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">{customer.email || customer.telephone || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{customer.produit_achete || "-"}</p>
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

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Liens rapides</CardTitle>
              <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard/customers" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="mr-2 h-4 w-4" />
                  Voir tous les clients
                </Button>
              </Link>
              <a
                href="https://noorshop-bamako.myshopify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Boutique Shopify
                </Button>
              </a>
              <a
                href="https://www.tiktok.com/@noorshopkidsmali1"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </Button>
              </a>
              <a
                href="https://www.facebook.com/people/Noorshop-Beaut%C3%A9-Enfant-Maison/61580601201096/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
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
