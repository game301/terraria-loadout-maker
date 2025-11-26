import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PublicLoadoutViewer from "./PublicLoadoutViewer"

export default async function PublicLoadoutPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log("========== LOADOUT PAGE ==========")
    console.log("Viewing loadout ID:", id)
    console.log("User authenticated:", !!user)
    console.log("User ID:", user?.id || "ANONYMOUS")
    console.log("===================================")

    // Fetch the loadout directly from loadouts table
    const { data: loadout, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("id", id)
        .eq("is_public", true)
        .single()

    console.log("========== QUERY RESULT ==========")
    console.log("Loadout found:", !!loadout)
    console.log("Error:", error)
    if (loadout) {
        console.log("Loadout name:", loadout.name)
        console.log("Is public:", loadout.is_public)
    }
    console.log("===================================")

    if (error) {
        console.error("Error fetching loadout:", error)
        return (
            <div className='min-h-screen terraria-bg p-8'>
                <div className='max-w-2xl mx-auto bg-red-900/20 border-2 border-red-500 rounded-lg p-6'>
                    <h1 className='text-2xl font-bold text-red-400 mb-4'>
                        Error Loading Loadout
                    </h1>
                    <p className='text-foreground mb-2'>
                        Error: {error.message}
                    </p>
                    <p className='text-gray-400 mb-4'>Code: {error.code}</p>
                    <pre className='bg-black/50 p-4 rounded text-sm overflow-auto'>
                        {JSON.stringify(error, null, 2)}
                    </pre>
                    <a
                        href='/loadouts'
                        className='inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded'>
                        Back to Browse
                    </a>
                </div>
            </div>
        )
    }

    if (!loadout) {
        console.log("No loadout found")
        return (
            <div className='min-h-screen terraria-bg p-8'>
                <div className='max-w-2xl mx-auto bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6'>
                    <h1 className='text-2xl font-bold text-yellow-400 mb-4'>
                        Loadout Not Found
                    </h1>
                    <p className='text-foreground mb-4'>
                        The loadout you're looking for doesn't exist or is not
                        public.
                    </p>
                    <a
                        href='/loadouts'
                        className='inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded'>
                        Back to Browse
                    </a>
                </div>
            </div>
        )
    }

    // Increment view count (fire and forget, don't wait)
    supabase
        .from("loadouts")
        .update({ view_count: (loadout.view_count || 0) + 1 })
        .eq("id", id)
        .then()

    // Check if favorited by current user
    let isFavorited = false
    if (user) {
        const { data: favorite } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("loadout_id", id)
            .single()

        isFavorited = !!favorite
    }

    return (
        <PublicLoadoutViewer
            loadout={loadout}
            isAuthenticated={!!user}
            initialIsFavorited={isFavorited}
        />
    )
}
