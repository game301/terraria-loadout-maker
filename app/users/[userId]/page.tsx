import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UserLoadoutsClient from "./UserLoadoutsClient"

export default async function UserLoadoutsPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId } = await params
    const supabase = await createClient()

    // Check if current user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Fetch public loadouts by this user
    const { data: loadouts } = await supabase
        .from("loadouts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })

    // Get username from the first loadout's creator_username, or fetch from user metadata
    let username = loadouts?.[0]?.creator_username

    // If no username from loadouts, try to fetch from auth.users
    if (!username) {
        const { data: userData } = await supabase.rpc("get_user_username", {
            uid: userId,
        })
        username = userData || `@${userId.substring(0, 8)}`
    }

    return (
        <UserLoadoutsClient
            loadouts={loadouts || []}
            username={username}
            userId={userId}
            isAuthenticated={!!user}
        />
    )
}
