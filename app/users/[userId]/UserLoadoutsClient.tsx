"use client"

import Link from "next/link"
import { getItemImageUrl, getTextFallbackImage } from "@/lib/terraria/images"

interface Loadout {
    id: string
    name: string
    game_mode: string
    helmet: any
    chest: any
    legs: any
    accessories: any
    weapons: any
    created_at: string
    current_username?: string
}

export default function UserLoadoutsClient({
    loadouts,
    username,
    userId,
    isAuthenticated,
}: {
    loadouts: Loadout[]
    username: string
    userId: string
    isAuthenticated: boolean
}) {
    const getUsedMods = (loadout: Loadout) => {
        if (loadout.game_mode === "vanilla") {
            return "Vanilla"
        }

        const allItems = [
            ...(Array.isArray(loadout.weapons) ? loadout.weapons : []),
            ...(Array.isArray(loadout.accessories) ? loadout.accessories : []),
            loadout.helmet,
            loadout.chest,
            loadout.legs,
        ].filter(Boolean)

        const mods = new Set<string>()
        allItems.forEach((item: any) => {
            if (item?.mod === "calamity") mods.add("Calamity")
            if (item?.mod === "thorium") mods.add("Thorium")
        })

        if (mods.size === 0) {
            return "Vanilla"
        }

        return Array.from(mods).join(", ")
    }

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-[1400px] mx-auto w-full p-6'>
                {/* Header */}
                <div className='mb-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-yellow-400 mb-2'>
                                {username}'s Loadouts
                            </h1>
                            <p className='text-gray-400'>
                                {loadouts.length} public loadout
                                {loadouts.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <Link
                            href='/loadouts'
                            className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all'>
                            Back to Browse
                        </Link>
                    </div>
                </div>

                {/* Loadouts Grid */}
                {loadouts.length === 0 ? (
                    <div className='text-center py-12'>
                        <p className='text-gray-400 text-lg'>
                            This user hasn't created any public loadouts yet
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {loadouts.map((loadout) => {
                            const weaponCount = Array.isArray(loadout.weapons)
                                ? loadout.weapons.length
                                : 0
                            const accessoryCount = Array.isArray(
                                loadout.accessories
                            )
                                ? loadout.accessories.length
                                : 0

                            return (
                                <Link
                                    key={loadout.id}
                                    href={`/loadouts/${loadout.id}`}
                                    className='block bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-yellow-500 transition-all cursor-pointer'>
                                    <h3 className='font-bold text-lg text-yellow-400 mb-2'>
                                        {loadout.name}
                                    </h3>

                                    {/* Preview items */}
                                    <div className='flex gap-2 mb-3 flex-wrap'>
                                        {loadout.helmet && (
                                            <img
                                                src={getItemImageUrl(
                                                    loadout.helmet.name,
                                                    loadout.helmet.mod
                                                )}
                                                alt={loadout.helmet.name}
                                                className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        getTextFallbackImage(
                                                            loadout.helmet.name,
                                                            40
                                                        )
                                                }}
                                            />
                                        )}
                                        {loadout.chest && (
                                            <img
                                                src={getItemImageUrl(
                                                    loadout.chest.name,
                                                    loadout.chest.mod
                                                )}
                                                alt={loadout.chest.name}
                                                className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        getTextFallbackImage(
                                                            loadout.chest.name,
                                                            40
                                                        )
                                                }}
                                            />
                                        )}
                                        {loadout.legs && (
                                            <img
                                                src={getItemImageUrl(
                                                    loadout.legs.name,
                                                    loadout.legs.mod
                                                )}
                                                alt={loadout.legs.name}
                                                className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        getTextFallbackImage(
                                                            loadout.legs.name,
                                                            40
                                                        )
                                                }}
                                            />
                                        )}
                                        {Array.isArray(loadout.weapons) &&
                                            loadout.weapons
                                                .slice(0, 2)
                                                .map((w: any, i: number) => (
                                                    <img
                                                        key={i}
                                                        src={getItemImageUrl(
                                                            w.name,
                                                            w.mod
                                                        )}
                                                        alt={w.name}
                                                        className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                getTextFallbackImage(
                                                                    w.name,
                                                                    40
                                                                )
                                                        }}
                                                    />
                                                ))}
                                    </div>

                                    <div className='flex justify-between items-center text-xs text-gray-400'>
                                        <div className='flex gap-3'>
                                            <span>{getUsedMods(loadout)}</span>
                                            <span>{weaponCount} weapons</span>
                                            <span>
                                                {accessoryCount} accessories
                                            </span>
                                        </div>
                                    </div>

                                    <div className='text-xs text-gray-500 mt-2'>
                                        {new Date(
                                            loadout.created_at
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
