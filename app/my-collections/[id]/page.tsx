import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CollectionViewer from "./CollectionViewer"

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    const { data: collection } = await supabase
        .from("collections")
        .select(
            "id, name, description, is_public, user_id, video_url, created_at, updated_at, view_count"
        )
        .eq("id", id)
        .single()

    if (!collection || collection.user_id !== user.id) {
        redirect("/my-collections")
    }

    return <CollectionViewer collection={collection} user={user} />
}
