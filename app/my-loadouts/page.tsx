import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserLoadouts } from "@/lib/terraria/loadouts"
import { unstable_noStore as noStore } from "next/cache"
import MyLoadoutsClient from "./MyLoadoutsClient"
import { PageButton } from "@/components/ui/page-button"

export default async function ProtectedPage() {
    noStore() // Opt out of caching for this page

    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    const loadouts = await getUserLoadouts(user.id)

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-3xl font-bold text-[hsl(var(--page-heading))]'>
                        My Loadouts
                    </h1>
                    <PageButton href='/loadouts/create'>
                        Create Loadout
                    </PageButton>
                </div>

                {loadouts.length === 0 ? (
                    <div className='text-center py-12 bg-[hsl(var(--card-bg))] border-2 border-[hsl(var(--card-border))] rounded-lg'>
                        <p className='text-lg text-[hsl(var(--page-text))]'>
                            You haven't created any loadouts yet.
                        </p>
                        <p className='text-sm mt-2 text-[hsl(var(--page-text-muted))]'>
                            Click "Create Loadout" to get started!
                        </p>
                    </div>
                ) : (
                    <MyLoadoutsClient loadouts={loadouts} />
                )}
            </div>
        </div>
    )
}
