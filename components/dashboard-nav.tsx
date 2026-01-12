"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Users, LogOut, Package, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

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
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const DesktopNav = () => (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
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

  const MobileNav = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <div className="flex flex-col space-y-4 mt-8">
          <div className="font-bold text-lg mb-4">NoorShopKids Mali</div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
          <div className="pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      <MobileNav />
      <DesktopNav />
    </>
  )
}
