import { createClient } from "@/lib/supabase/server"
import BrowseCollectionsClient from "./BrowseCollectionsClient"

export default async function BrowseCollectionsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Fetch public collections with loadout count
    const { data: collections } = await supabase
        .from("collections")
        .select(
            `
            id,
            name,
            description,
            is_public,
            created_at,
            user_id,
            collection_loadouts(count)
        `
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })

    const collectionsWithCount =
        collections?.map((col: any) => ({
            ...col,
            loadout_count: col.collection_loadouts?.[0]?.count || 0,
        })) || []

    return (
        <BrowseCollectionsClient
            initialCollections={collectionsWithCount}
            isAuthenticated={!!user}
        />
    )
}
