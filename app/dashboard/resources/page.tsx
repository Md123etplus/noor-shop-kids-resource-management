import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ResourcesTable } from "@/components/resources-table"

export default async function ResourcesPage() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/login")
    }
  } catch (error) {
    console.error("Error checking auth:", error)
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ressources Clients</h1>
        <p className="text-muted-foreground">Gérez vos ressources clients</p>
      </div>
      <ResourcesTable />
    </div>
  )
}
