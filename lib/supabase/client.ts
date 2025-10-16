import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Creating Supabase browser client")
  console.log("[v0] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log("[v0] ANON_KEY length:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)

  const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  console.log("[v0] Supabase client created successfully")
  return client
}
