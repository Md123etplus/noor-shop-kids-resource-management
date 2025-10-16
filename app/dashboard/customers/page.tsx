import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CustomersTable } from "@/components/customers-table"

export default async function CustomersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching customers:", error)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Clients</h2>
      </div>
      <CustomersTable initialCustomers={customers || []} />
    </div>
  )
}
