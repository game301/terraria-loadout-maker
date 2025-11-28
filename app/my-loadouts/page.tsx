import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserLoadouts } from "@/lib/terraria/loadouts"
import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import MyLoadoutsClient from "./MyLoadoutsClient"

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
                    <h1 className='text-3xl font-bold text-foreground'>
                        My Loadouts
                    </h1>
                    <Link
                        href='/loadouts/create'
                        className='px-4 py-2 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-2 border-green-400 rounded-lg font-semibold text-foreground uppercase tracking-wide text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] transition-all'>
                        Create New Loadout
                    </Link>
                </div>

                {loadouts.length === 0 ? (
                    <div className='text-center py-12 bg-gradient-to-b card-dark border-2 border-dark rounded-lg'>
                        <p className='text-lg text-gray-700 dark:text-gray-300'>
                            You haven't created any loadouts yet.
                        </p>
                        <p className='text-sm mt-2 text-gray-400'>
                            Click "Create New Loadout" to get started!
                        </p>
                    </div>
                ) : (
                    <MyLoadoutsClient loadouts={loadouts} />
                )}
            </div>
        </div>
    )
}
