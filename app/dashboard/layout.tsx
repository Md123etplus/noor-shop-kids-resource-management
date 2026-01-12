import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import Link from "next/link"

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
        <div className="container flex h-14 sm:h-16 items-center px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <DashboardNav />
            <Link href="/dashboard" className="flex items-center">
              <span className="font-bold text-base sm:text-xl">NoorShopKids Mali</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-4 sm:py-6 px-4">{children}</main>
    </div>
  )
}
