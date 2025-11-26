import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CollectionsClient from "./CollectionsClient"

export default async function CollectionsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    return <CollectionsClient user={user} />
}
