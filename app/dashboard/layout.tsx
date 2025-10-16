import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }
  } catch (error) {
    console.error("[v0] Dashboard layout auth error:", error)
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">NoorShopKids Mali</span>
            </Link>
          </div>
          <DashboardNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
