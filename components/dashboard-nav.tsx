"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, LogOut, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Ressources",
    href: "/dashboard/resources",
    icon: Package,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
              pathname === item.href ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
      <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-auto">
        <LogOut className="h-4 w-4 mr-2" />
        Déconnexion
      </Button>
    </nav>
  )
}
