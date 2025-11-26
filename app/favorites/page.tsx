import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FavoritesClient from "./FavoritesClient"

export default async function FavoritesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Fetch user's favorite loadouts
    const { data: favorites } = await supabase
        .from("favorites")
        .select("loadout_id, loadouts(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const loadouts =
        favorites
            ?.filter((item: any) => item.loadouts)
            .map((item: any) => item.loadouts) || []

    // Fetch user's favorite collections with loadout count
    const { data: collectionFavorites } = await supabase
        .from("collection_favorites")
        .select(
            `
            collection_id,
            collections (
                id,
                name,
                description,
                is_public,
                created_at
            )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Get loadout counts for each collection
    const collectionsWithCount = await Promise.all(
        (collectionFavorites || [])
            .filter((item: any) => item.collections)
            .map(async (item: any) => {
                const { count } = await supabase
                    .from("collection_loadouts")
                    .select("*", { count: "exact", head: true })
                    .eq("collection_id", item.collections.id)

                return {
                    ...item.collections,
                    loadout_count: count || 0,
                }
            })
    )

    return (
        <FavoritesClient
            initialLoadouts={loadouts}
            currentUserId={user.id}
            initialCollections={collectionsWithCount}
        />
    )
}
