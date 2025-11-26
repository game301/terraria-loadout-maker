"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getItemImageUrl, getTextFallbackImage } from "@/lib/terraria/images"

interface Loadout {
    id: string
    name: string
    game_mode: string
    user_id: string
    helmet: any
    chest: any
    legs: any
    accessories: any
    weapons: any
    created_at: string
}

interface Collection {
    id: string
    name: string
    description: string | null
    is_public: boolean
    created_at: string
    loadout_count?: number
}

export default function FavoritesClient({
    initialLoadouts,
    initialCollections,
    currentUserId,
}: {
    initialLoadouts: Loadout[]
    initialCollections: Collection[]
    currentUserId: string
}) {
    const [loadouts, setLoadouts] = useState<Loadout[]>(initialLoadouts)
    const [collections, setCollections] =
        useState<Collection[]>(initialCollections)
    const [activeTab, setActiveTab] = useState<"loadouts" | "collections">(
        "loadouts"
    )

    const handleRemoveFavorite = async (loadoutId: string) => {
        if (!confirm("Remove this loadout from your favorites?")) return

        const supabase = createClient()
        const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("loadout_id", loadoutId)

        if (error) {
            console.error("Error removing favorite:", error)
            alert("Failed to remove favorite. Please try again.")
            return
        }

        setLoadouts(loadouts.filter((l) => l.id !== loadoutId))
    }

    const handleRemoveCollectionFavorite = async (collectionId: string) => {
        if (!confirm("Remove this collection from your favorites?")) return

        const supabase = createClient()
        const { error } = await supabase
            .from("collection_favorites")
            .delete()
            .eq("collection_id", collectionId)

        if (error) {
            console.error("Error removing favorite:", error)
            alert("Failed to remove favorite. Please try again.")
            return
        }

        setCollections(collections.filter((c) => c.id !== collectionId))
    }

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
        <div className='max-w-[1400px] mx-auto w-full p-4'>
            <div className='mb-6'>
                <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
                    My Favorites
                </h1>
                <p className='text-gray-400'>
                    Loadouts and collections you've marked as favorites
                </p>

                {/* Tabs */}
                <div className='flex gap-2 mt-4'>
                    <button
                        onClick={() => setActiveTab("loadouts")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            activeTab === "loadouts"
                                ? "bg-cyan-600 text-foreground"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}>
                        Loadouts ({loadouts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("collections")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            activeTab === "collections"
                                ? "bg-cyan-600 text-foreground"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}>
                        Collections ({collections.length})
                    </button>
                </div>
            </div>

            {activeTab === "loadouts" ? (
                loadouts.length === 0 ? (
                    <div className='text-center py-12'>
                        <div className='text-6xl mb-4'>⭐</div>
                        <p className='text-gray-400 text-lg mb-2'>
                            No favorite loadouts yet
                        </p>
                        <p className='text-gray-500 text-sm mb-4'>
                            Browse loadouts and click the star icon to add them
                            to your favorites
                        </p>
                        <Link
                            href='/loadouts'
                            className='inline-block px-6 py-3 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border-2 border-cyan-400 rounded-lg font-bold text-foreground uppercase tracking-wide text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(6,182,212,0.5)] transition-all'>
                            Browse Loadouts
                        </Link>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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
                                <div
                                    key={loadout.id}
                                    className='relative bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-yellow-500 transition-all'>
                                    <Link href={`/loadouts/${loadout.id}`}>
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
                                                                loadout.helmet
                                                                    .name,
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
                                                                loadout.chest
                                                                    .name,
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
                                                                loadout.legs
                                                                    .name,
                                                                40
                                                            )
                                                    }}
                                                />
                                            )}
                                            {Array.isArray(loadout.weapons) &&
                                                loadout.weapons
                                                    .slice(0, 2)
                                                    .map(
                                                        (w: any, i: number) => (
                                                            <img
                                                                key={i}
                                                                src={getItemImageUrl(
                                                                    w.name,
                                                                    w.mod
                                                                )}
                                                                alt={w.name}
                                                                className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.src =
                                                                        getTextFallbackImage(
                                                                            w.name,
                                                                            40
                                                                        )
                                                                }}
                                                            />
                                                        )
                                                    )}
                                        </div>

                                        <div className='flex justify-between items-center text-xs text-gray-400'>
                                            <div className='flex gap-3'>
                                                <span>
                                                    {getUsedMods(loadout)}
                                                </span>
                                                <span>
                                                    {weaponCount} weapons
                                                </span>
                                                <span>
                                                    {accessoryCount} accessories
                                                </span>
                                            </div>
                                        </div>

                                        <div className='flex justify-between items-center text-xs mt-2'>
                                            <span className='text-gray-500'>
                                                {new Date(
                                                    loadout.created_at
                                                ).toLocaleDateString()}
                                            </span>
                                            {(loadout as any)
                                                .creator_username && (
                                                <span
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        window.location.href = `/users/${
                                                            (loadout as any)
                                                                .user_id
                                                        }`
                                                    }}
                                                    className='text-yellow-300/70 hover:text-yellow-300 hover:underline transition-colors cursor-pointer'>
                                                    by{" "}
                                                    {
                                                        (loadout as any)
                                                            .creator_username
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleRemoveFavorite(loadout.id)
                                        }}
                                        className='absolute top-2 right-2 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600 rounded text-red-400 transition-colors'
                                        title='Remove from favorites'>
                                        <svg
                                            className='w-4 h-4'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'>
                                            <path
                                                fillRule='evenodd'
                                                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                                clipRule='evenodd'></path>
                                        </svg>
                                    </button>

                                    {/* Edit button for own loadouts */}
                                    {loadout.user_id === currentUserId && (
                                        <Link
                                            href={`/my-loadouts/${loadout.id}/edit`}
                                            onClick={(e) => e.stopPropagation()}
                                            className='absolute top-2 right-14 p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/40 border border-blue-500 dark:border-blue-600 rounded text-blue-600 dark:text-blue-400 transition-colors'
                                            title='Edit loadout'>
                                            <svg
                                                className='w-4 h-4'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'>
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                />
                                            </svg>
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            ) : collections.length === 0 ? (
                <div className='text-center py-12'>
                    <div className='text-6xl mb-4'>📚</div>
                    <p className='text-gray-400 text-lg mb-2'>
                        No favorite collections yet
                    </p>
                    <p className='text-gray-500 text-sm mb-4'>
                        Browse collections and click the star icon to add them
                        to your favorites
                    </p>
                    <Link
                        href='/collections'
                        className='inline-block px-6 py-3 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border-2 border-cyan-400 rounded-lg font-bold text-foreground uppercase tracking-wide text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(6,182,212,0.5)] transition-all'>
                        Browse Collections
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className='relative bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-yellow-500 transition-all'>
                            <Link href={`/collections/${collection.id}`}>
                                <h3 className='font-bold text-lg text-yellow-400 mb-2 line-clamp-2'>
                                    {collection.name}
                                </h3>

                                {collection.description && (
                                    <p className='text-sm text-gray-400 mb-3 line-clamp-2'>
                                        {collection.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className='flex items-center gap-3 text-xs text-gray-400 mb-2'>
                                    <span>
                                        📦 {collection.loadout_count}{" "}
                                        {collection.loadout_count === 1
                                            ? "loadout"
                                            : "loadouts"}
                                    </span>
                                </div>

                                {/* Created date */}
                                <div className='text-xs text-gray-500'>
                                    Created{" "}
                                    {new Date(
                                        collection.created_at
                                    ).toLocaleDateString()}
                                </div>
                            </Link>

                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleRemoveCollectionFavorite(
                                        collection.id
                                    )
                                }}
                                className='absolute top-2 right-2 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600 rounded text-red-400 transition-colors'
                                title='Remove from favorites'>
                                <svg
                                    className='w-4 h-4'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'>
                                    <path
                                        fillRule='evenodd'
                                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                        clipRule='evenodd'></path>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
