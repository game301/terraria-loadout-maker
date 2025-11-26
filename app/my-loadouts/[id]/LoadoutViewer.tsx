"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Toast } from "@/components/ui/toast"
import YouTubeEmbed from "@/components/YouTubeEmbed"
import {
    getItemImageUrl,
    getBossImageUrl,
    handleImageError,
} from "@/lib/terraria/images"
import bossesVanilla from "@/data/bosses-vanilla.json"
import bossesCalamity from "@/data/bosses-calamity.json"
import bossesThorium from "@/data/bosses-thorium.json"

const getRarityColor = (rarity: number) => {
    const rarityColors: { [key: number]: string } = {
        0: "text-foreground",
        1: "text-blue-400",
        2: "text-green-400",
        3: "text-orange-400",
        4: "text-red-400",
        5: "text-pink-400",
        6: "text-purple-400",
        7: "text-lime-400",
        8: "text-yellow-400",
        9: "text-cyan-400",
        10: "text-red-500",
        11: "text-pink-500",
    }
    return rarityColors[rarity] || "text-gray-700 dark:text-gray-300"
}

export default function LoadoutViewer({ loadout }: { loadout: any }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isCloning, setIsCloning] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (copySuccess) {
            const timer = setTimeout(() => setCopySuccess(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [copySuccess])

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${loadout.name}"?`)) {
            return
        }

        setIsDeleting(true)
        const supabase = createClient()

        const { error } = await supabase
            .from("loadouts")
            .delete()
            .eq("id", loadout.id)

        if (error) {
            alert("Failed to delete loadout")
            setIsDeleting(false)
        } else {
            router.push("/my-loadouts")
        }
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/loadouts/${loadout.id}`
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true)
        })
    }

    const handleClone = async () => {
        const newName = prompt(
            `Enter a name for the cloned loadout:`,
            `${loadout.name} (Copy)`
        )

        if (!newName || !newName.trim()) {
            return
        }

        setIsCloning(true)
        const supabase = createClient()

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                alert("You must be signed in to clone a loadout")
                setIsCloning(false)
                return
            }

            // Create a copy of the loadout with new name
            const clonedLoadout = {
                user_id: user.id,
                name: newName.trim(),
                description: loadout.description,
                game_mode: loadout.gameMode,
                is_public: false, // Clones start as private
                creator_username:
                    user.user_metadata?.username ||
                    `@${user.id.substring(0, 8)}`,
                helmet: loadout.armor.head,
                chest: loadout.armor.chest,
                legs: loadout.armor.legs,
                accessories: loadout.accessories,
                weapons: loadout.weapons,
                buffs: loadout.buffs,
                target_boss: loadout.targetBoss,
                version_tag: loadout.versionTag,
                video_link: loadout.videoLink,
            }

            const { data, error } = await supabase
                .from("loadouts")
                .insert(clonedLoadout)
                .select()
                .single()

            if (error) throw error

            // Redirect to edit the cloned loadout
            router.push(`/my-loadouts/${data.id}/edit`)
        } catch (error) {
            console.error("Error cloning loadout:", error)
            alert("Failed to clone loadout. Please try again.")
            setIsCloning(false)
        }
    }

    const armor = [loadout.armor.head, loadout.armor.chest, loadout.armor.legs]

    return (
        <div className='min-h-screen terraria-bg'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
                <h1 className='text-2xl sm:text-3xl font-bold text-foreground uppercase break-words min-w-0 max-w-full'>
                    {loadout.name}
                </h1>
                <div className='flex gap-2 flex-wrap'>
                    <button
                        onClick={handleCopyLink}
                        className='px-4 py-2 bg-green-700/50 hover:bg-green-600/50 border-2 border-green-600 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap flex items-center gap-2'>
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'>
                            <path d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'></path>
                        </svg>
                        Share
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={isCloning}
                        className='px-4 py-2 bg-purple-600/50 hover:bg-purple-500/50 disabled:bg-gray-300 dark:disabled:bg-gray-700/50 border-2 border-purple-500 dark:border-purple-600 disabled:border-gray-400 dark:disabled:border-gray-600 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap disabled:cursor-not-allowed flex items-center gap-2'>
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'>
                            <path d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'></path>
                        </svg>
                        {isCloning ? "Cloning..." : "Clone"}
                    </button>
                    <Link
                        href={`/my-loadouts/${loadout.id}/edit`}
                        className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className='px-4 py-2 bg-red-600/50 hover:bg-red-500/50 disabled:bg-gray-300 dark:disabled:bg-gray-700/50 border-2 border-red-500 disabled:border-gray-400 dark:disabled:border-gray-600 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap disabled:cursor-not-allowed'>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                    <Link
                        href='/my-loadouts'
                        className='px-4 py-2 bg-gray-600/50 hover:bg-gray-500/50 border-2 border-gray-500 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                        Back to My Loadouts
                    </Link>
                </div>
            </div>

            <Toast
                message='Link copied to clipboard!'
                show={copySuccess}
                onClose={() => setCopySuccess(false)}
            />

            <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4'>
                {/* Left Panel - Armor */}
                <div className='space-y-4'>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                            Armor
                        </h2>
                        <div className='space-y-2'>
                            {["Helmet", "Chestplate", "Leggings"].map(
                                (piece, index) => (
                                    <div
                                        key={piece}
                                        className='flex items-center gap-3'>
                                        <div className='w-16 h-16 bg-gradient-to-br slot-bg border-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center'>
                                            {armor[index] ? (
                                                <img
                                                    src={getItemImageUrl(
                                                        armor[index].name,
                                                        armor[index].mod
                                                    )}
                                                    alt={armor[index].name}
                                                    className='w-12 h-12 object-contain'
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            armor[index].name,
                                                            armor[index].mod,
                                                            48
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <div className='text-2xl text-gray-600'>
                                                    -
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex-1'>
                                            <div
                                                className={`text-sm font-medium ${
                                                    armor[index]
                                                        ? getRarityColor(
                                                              armor[index]
                                                                  .rarity || 0
                                                          )
                                                        : "text-gray-500"
                                                }`}>
                                                {armor[index]?.name ||
                                                    `No ${piece}`}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {loadout.buffs.length > 0 && (
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                Active Buffs
                            </h2>
                            <div className='grid grid-cols-3 gap-2'>
                                {loadout.buffs.map((buff: any, i: number) => (
                                    <div
                                        key={i}
                                        className='w-12 h-12 bg-gradient-to-br slot-bg border-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center'>
                                        <img
                                            src={getItemImageUrl(
                                                buff.name,
                                                buff.mod
                                            )}
                                            alt={buff.name}
                                            className='w-10 h-10 object-contain'
                                            onError={(e) =>
                                                handleImageError(
                                                    e,
                                                    buff.name,
                                                    buff.mod,
                                                    40
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Panel - Weapons + Accessories on mobile */}
                <div className='space-y-4'>
                    {loadout.weapons.length > 0 && (
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wider text-center'>
                                Weapons ({loadout.weapons.length})
                            </h2>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center'>
                                {loadout.weapons.map(
                                    (weapon: any, i: number) => (
                                        <div
                                            key={i}
                                            className='flex flex-col items-center gap-2'>
                                            <div className='weapon-slot flex flex-col items-center justify-center'>
                                                <img
                                                    src={getItemImageUrl(
                                                        weapon.name,
                                                        weapon.mod
                                                    )}
                                                    alt={weapon.name}
                                                    className='w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-contain'
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            weapon.name,
                                                            weapon.mod,
                                                            100
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className='text-center'>
                                                <div
                                                    className={`text-xs sm:text-sm font-bold ${getRarityColor(
                                                        weapon.rarity || 0
                                                    )}`}>
                                                    {weapon.name}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Accessories - Mobile Only */}
                    {loadout.accessories.length > 0 && (
                        <div className='lg:hidden bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider text-center'>
                                Accessories ({loadout.accessories.length})
                            </h2>
                            <div className='space-y-2'>
                                {loadout.accessories.map(
                                    (accessory: any, i: number) => (
                                        <div
                                            key={i}
                                            className='flex items-center gap-2'>
                                            <div className='accessory-slot flex flex-col items-center justify-center shrink-0'>
                                                <img
                                                    src={getItemImageUrl(
                                                        accessory.name,
                                                        accessory.mod
                                                    )}
                                                    alt={accessory.name}
                                                    className='w-10 h-10 sm:w-12 sm:h-12 object-contain'
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            accessory.name,
                                                            accessory.mod,
                                                            48
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <div
                                                    className={`text-xs font-semibold truncate ${getRarityColor(
                                                        accessory.rarity || 0
                                                    )}`}>
                                                    {accessory.name}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <div className='text-sm space-y-2'>
                            {loadout.versionTag && (
                                <div className='flex justify-between items-center'>
                                    <span className='text-gray-400'>
                                        Version:
                                    </span>
                                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700'>
                                        {loadout.versionTag}
                                    </span>
                                </div>
                            )}
                            <div className='flex justify-between items-center'>
                                <span className='text-gray-400'>Mods:</span>
                                <div className='flex gap-1 flex-wrap justify-end'>
                                    {loadout.gameMode === "vanilla" ? (
                                        <Link
                                            href='/loadouts?mod=vanilla'
                                            className='text-cyan-400 hover:text-cyan-300 hover:underline transition-colors'>
                                            Vanilla
                                        </Link>
                                    ) : (
                                        (() => {
                                            const allItems = [
                                                ...loadout.weapons,
                                                ...loadout.accessories,
                                                ...loadout.buffs,
                                                loadout.armor.head,
                                                loadout.armor.chest,
                                                loadout.armor.legs,
                                            ].filter(Boolean)
                                            const mods = new Set<string>()
                                            allItems.forEach((item: any) => {
                                                if (item?.mod === "calamity")
                                                    mods.add("calamity")
                                                if (item?.mod === "thorium")
                                                    mods.add("thorium")
                                            })

                                            return Array.from(mods).length >
                                                0 ? (
                                                Array.from(mods).map(
                                                    (mod, index) => (
                                                        <span key={mod}>
                                                            {index > 0 && (
                                                                <span className='text-gray-400'>
                                                                    ,{" "}
                                                                </span>
                                                            )}
                                                            <Link
                                                                href={`/loadouts?mod=${mod}`}
                                                                className='text-cyan-400 hover:text-cyan-300 hover:underline transition-colors capitalize'>
                                                                {mod}
                                                            </Link>
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <Link
                                                    href='/loadouts?mod=vanilla'
                                                    className='text-cyan-400 hover:text-cyan-300 hover:underline transition-colors'>
                                                    Vanilla
                                                </Link>
                                            )
                                        })()
                                    )}
                                </div>
                            </div>
                            {loadout.targetBoss && (
                                <div>
                                    <span className='text-gray-400 block mb-2'>
                                        Target Boss:
                                    </span>
                                    <div className='flex flex-wrap gap-2'>
                                        {loadout.targetBoss
                                            .split(" | ")
                                            .map((bossName: string) => {
                                                const allBosses = [
                                                    ...bossesVanilla.map(
                                                        (b) => ({
                                                            ...b,
                                                            mod: "vanilla",
                                                        })
                                                    ),
                                                    ...bossesCalamity.map(
                                                        (b) => ({
                                                            ...b,
                                                            mod: "calamity",
                                                        })
                                                    ),
                                                    ...bossesThorium.map(
                                                        (b) => ({
                                                            ...b,
                                                            mod: "thorium",
                                                        })
                                                    ),
                                                ]
                                                const boss = allBosses.find(
                                                    (b) => b.name === bossName
                                                )
                                                const bossMod =
                                                    boss?.mod || "vanilla"

                                                return (
                                                    <div
                                                        key={bossName}
                                                        className='flex items-center gap-2 px-2 py-1 bg-cyan-900/30 border border-cyan-600 rounded text-sm'>
                                                        <img
                                                            src={getBossImageUrl(
                                                                bossName,
                                                                bossMod
                                                            )}
                                                            alt={bossName}
                                                            className='w-8 h-8 object-contain'
                                                            onError={(e) => {
                                                                const target =
                                                                    e.currentTarget
                                                                const initial =
                                                                    bossName
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect fill='%23374151' width='32' height='32' rx='4'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='%23fff' font-size='16' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`
                                                            }}
                                                        />
                                                        <span className='text-cyan-300'>
                                                            {bossName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>Created:</span>
                                <span className='text-cyan-400'>
                                    {new Date(
                                        loadout.createdAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>Updated:</span>
                                <span className='text-cyan-400'>
                                    {new Date(
                                        loadout.updatedAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            {(loadout.viewCount || 0) > 0 && (
                                <div className='flex justify-between'>
                                    <span className='text-gray-400'>
                                        Views:
                                    </span>
                                    <span className='text-cyan-400'>
                                        {loadout.viewCount?.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Embed */}
                    {loadout.videoLink && (
                        <YouTubeEmbed
                            url={loadout.videoLink}
                            title={`${loadout.name} - Video Guide`}
                        />
                    )}
                </div>

                {/* Right Panel - Accessories (Desktop Only) */}
                <div className='hidden lg:block space-y-4'>
                    {loadout.accessories.length > 0 && (
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider text-center'>
                                Accessories ({loadout.accessories.length})
                            </h2>
                            <div className='space-y-2'>
                                {loadout.accessories.map(
                                    (accessory: any, i: number) => (
                                        <div
                                            key={i}
                                            className='flex items-center gap-2'>
                                            <div className='accessory-slot flex flex-col items-center justify-center shrink-0'>
                                                <img
                                                    src={getItemImageUrl(
                                                        accessory.name,
                                                        accessory.mod
                                                    )}
                                                    alt={accessory.name}
                                                    className='w-10 h-10 sm:w-12 sm:h-12 object-contain'
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            accessory.name,
                                                            accessory.mod,
                                                            48
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <div
                                                    className={`text-xs font-semibold truncate ${getRarityColor(
                                                        accessory.rarity || 0
                                                    )}`}>
                                                    {accessory.name}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
