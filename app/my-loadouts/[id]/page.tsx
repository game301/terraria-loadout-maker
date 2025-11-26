import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLoadoutById } from "@/lib/terraria/loadouts"
import { unstable_noStore as noStore } from "next/cache"
import LoadoutViewer from "./LoadoutViewer"

export default async function LoadoutDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    noStore()

    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    const loadout = await getLoadoutById(id)

    if (!loadout) {
        redirect("/my-loadouts")
    }

    // Check if user owns this loadout
    if (loadout.userId !== user.id) {
        redirect("/my-loadouts")
    }

    return <LoadoutViewer loadout={loadout} />
}
