import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditLoadoutClient from "./EditLoadoutClient"

export default async function EditLoadoutPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Fetch the loadout
    const { data: loadout, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !loadout) {
        redirect("/my-loadouts")
    }

    // Check if user owns this loadout
    if (loadout.user_id !== user.id) {
        redirect("/my-loadouts")
    }

    return <EditLoadoutClient loadout={loadout} />
}
