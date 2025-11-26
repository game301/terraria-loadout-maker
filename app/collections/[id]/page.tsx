import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import PublicCollectionViewer from "./PublicCollectionViewer"

export default async function PublicCollectionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: collection } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .eq("is_public", true)
        .single()

    if (!collection) {
        notFound()
    }

    // Increment view count (fire and forget)
    supabase
        .from("collections")
        .update({ view_count: (collection.view_count || 0) + 1 })
        .eq("id", id)
        .then()

    // Check if favorited by current user
    let isFavorited = false
    let userVote = 0
    if (user) {
        const { data: favorite } = await supabase
            .from("collection_favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("collection_id", id)
            .single()

        isFavorited = !!favorite

        const { data: vote } = await supabase
            .from("collection_votes")
            .select("vote")
            .eq("user_id", user.id)
            .eq("collection_id", id)
            .single()

        userVote = vote?.vote || 0
    }

    return (
        <PublicCollectionViewer
            collection={collection}
            isAuthenticated={!!user}
            initialIsFavorited={isFavorited}
            initialUserVote={userVote}
        />
    )
}
