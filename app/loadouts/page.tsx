import { createClient } from "@/lib/supabase/server"
import LoadoutsClient from "./LoadoutsClient"

export default async function LoadoutsPage() {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Fetch initial public loadouts
    const { data: loadouts } = await supabase
        .from("loadouts")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(0, 19)

    return (
        <LoadoutsClient
            initialLoadouts={loadouts || []}
            isAuthenticated={!!user}
        />
    )
}
