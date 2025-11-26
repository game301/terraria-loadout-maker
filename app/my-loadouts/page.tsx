import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserLoadouts } from "@/lib/terraria/loadouts"
import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"

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
            <div className='max-w-7xl mx-auto w-full p-4'>
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
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {loadouts.map((loadout) => {
                            // Detect mods used
                            const getUsedMods = () => {
                                if (loadout.gameMode === "vanilla") {
                                    return "Vanilla"
                                }

                                const allItems = [
                                    ...loadout.weapons,
                                    ...loadout.accessories,
                                    loadout.armor.head,
                                    loadout.armor.chest,
                                    loadout.armor.legs,
                                ].filter(Boolean)

                                const mods = new Set<string>()
                                allItems.forEach((item: any) => {
                                    if (item?.mod === "calamity")
                                        mods.add("Calamity")
                                    if (item?.mod === "thorium")
                                        mods.add("Thorium")
                                })

                                if (mods.size === 0) {
                                    return "Vanilla"
                                }

                                return Array.from(mods).join(", ")
                            }

                            return (
                                <Link
                                    key={loadout.id}
                                    href={`/my-loadouts/${loadout.id}`}
                                    className='bg-gradient-to-b card-dark border-2 border-dark hover:border-[#3a4a6a] rounded-lg p-4 transition-all hover:scale-[1.02]'>
                                    <h3 className='font-bold text-lg text-yellow-400 mb-2 break-words'>
                                        {loadout.name}
                                    </h3>

                                    <div className='space-y-2 text-sm'>
                                        <div className='text-gray-700 dark:text-gray-300'>
                                            Mods:{" "}
                                            <span className='text-cyan-400'>
                                                {getUsedMods()}
                                            </span>
                                        </div>

                                        {loadout.weapons.length > 0 && (
                                            <div className='text-gray-400'>
                                                {loadout.weapons.length} weapon
                                                {loadout.weapons.length !== 1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        )}

                                        {loadout.accessories.length > 0 && (
                                            <div className='text-gray-400'>
                                                {loadout.accessories.length}{" "}
                                                accessor
                                                {loadout.accessories.length !==
                                                1
                                                    ? "ies"
                                                    : "y"}
                                            </div>
                                        )}
                                    </div>

                                    <div className='mt-4 text-xs text-gray-500'>
                                        Created{" "}
                                        {new Date(
                                            loadout.createdAt
                                        ).toLocaleDateString()}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
