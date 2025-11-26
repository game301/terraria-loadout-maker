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
    getTextFallbackImage,
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

interface Item {
    id: number
    name: string
    mod?: string
    rarity?: number
}

interface LoadoutProps {
    id: string
    name: string
    game_mode: string
    creator_username?: string
    user_id?: string
    helmet?: Item
    chest?: Item
    legs?: Item
    accessories: Item[]
    weapons: Item[]
    buffs: Item[]
    created_at: string
    updated_at?: string
    is_public: boolean
    view_count?: number
    vote_score?: number
    version_tag?: string | null
    video_link?: string | null
    target_boss?: string | null
}

export default function PublicLoadoutViewer({
    loadout,
    isAuthenticated,
    initialIsFavorited,
}: {
    loadout: LoadoutProps
    isAuthenticated: boolean
    initialIsFavorited: boolean
}) {
    const router = useRouter()
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)
    const [creatorLoadouts, setCreatorLoadouts] = useState<any[]>([])
    const [userVote, setUserVote] = useState<number | null>(null) // -1, 0, or 1
    const [voteScore, setVoteScore] = useState(loadout.vote_score || 0)
    const [isVoting, setIsVoting] = useState(false)
    const [isCloning, setIsCloning] = useState(false)
    const [tags, setTags] = useState<string[]>([])

    const helmet = loadout.helmet
    const chest = loadout.chest
    const legs = loadout.legs
    const armor = [helmet, chest, legs]

    const weapons = Array.isArray(loadout.weapons) ? loadout.weapons : []
    const accessories = Array.isArray(loadout.accessories)
        ? loadout.accessories
        : []
    const buffs = Array.isArray(loadout.buffs) ? loadout.buffs : []

    // Detect which mods are being used based on items
    const getUsedMods = () => {
        if (loadout.game_mode === "vanilla") {
            return "Vanilla"
        }

        const allItems = [
            ...weapons,
            ...accessories,
            ...buffs,
            helmet,
            chest,
            legs,
        ].filter(Boolean)

        const mods = new Set<string>()
        allItems.forEach((item) => {
            if (item?.mod === "calamity") mods.add("Calamity")
            if (item?.mod === "thorium") mods.add("Thorium")
        })

        if (mods.size === 0) {
            return "Vanilla"
        }

        return Array.from(mods).join(", ")
    }

    // Fetch user's vote status
    useEffect(() => {
        if (isAuthenticated) {
            const fetchUserVote = async () => {
                const supabase = createClient()
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (user) {
                    const { data, error } = await supabase
                        .from("votes")
                        .select("vote_type")
                        .eq("loadout_id", loadout.id)
                        .eq("user_id", user.id)
                        .maybeSingle()

                    if (data && !error) {
                        setUserVote(data.vote_type)
                    }
                }
            }
            fetchUserVote()
        }
    }, [isAuthenticated, loadout.id])

    // Fetch creator's other loadouts
    useEffect(() => {
        if (loadout.user_id) {
            const fetchCreatorLoadouts = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from("loadouts")
                    .select("id, name, view_count, vote_score")
                    .eq("user_id", loadout.user_id)
                    .eq("is_public", true)
                    .neq("id", loadout.id)
                    .order("created_at", { ascending: false })
                    .limit(3)

                if (data) {
                    setCreatorLoadouts(data)
                }
            }
            fetchCreatorLoadouts()
        }
    }, [loadout.user_id, loadout.id])

    // Copy link to clipboard
    const handleCopyLink = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true)
        })
    }

    const handleVote = async (voteType: number) => {
        if (!isAuthenticated) {
            if (
                confirm("You need to be signed in to vote. Go to login page?")
            ) {
                router.push("/auth/login")
            }
            return
        }

        setIsVoting(true)
        const supabase = createClient()

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("User not authenticated")
            }

            // If clicking the same vote, remove it
            if (userVote === voteType) {
                // Delete vote
                const { error: deleteError } = await supabase
                    .from("votes")
                    .delete()
                    .eq("loadout_id", loadout.id)
                    .eq("user_id", user.id)

                if (deleteError) throw deleteError

                // Update local state
                setUserVote(null)
                setVoteScore(voteScore - voteType)

                // Update loadout vote_score
                await supabase
                    .from("loadouts")
                    .update({ vote_score: voteScore - voteType })
                    .eq("id", loadout.id)
            } else {
                // Check if user already voted
                const { data: existingVote } = await supabase
                    .from("votes")
                    .select("vote_type")
                    .eq("loadout_id", loadout.id)
                    .eq("user_id", user.id)
                    .maybeSingle()

                if (existingVote) {
                    // Update existing vote
                    const { error: updateError } = await supabase
                        .from("votes")
                        .update({ vote_type: voteType })
                        .eq("loadout_id", loadout.id)
                        .eq("user_id", user.id)

                    if (updateError) throw updateError

                    // Update local state (remove old vote, add new vote)
                    const oldVote = existingVote.vote_type
                    setUserVote(voteType)
                    setVoteScore(voteScore - oldVote + voteType)

                    // Update loadout vote_score
                    await supabase
                        .from("loadouts")
                        .update({ vote_score: voteScore - oldVote + voteType })
                        .eq("id", loadout.id)
                } else {
                    // Insert new vote
                    const { error: insertError } = await supabase
                        .from("votes")
                        .insert({
                            loadout_id: loadout.id,
                            user_id: user.id,
                            vote_type: voteType,
                        })

                    if (insertError) throw insertError

                    // Update local state
                    setUserVote(voteType)
                    setVoteScore(voteScore + voteType)

                    // Update loadout vote_score
                    await supabase
                        .from("loadouts")
                        .update({ vote_score: voteScore + voteType })
                        .eq("id", loadout.id)
                }
            }
        } catch (error) {
            console.error("Error voting:", error)
            alert("Failed to vote. Please try again.")
        } finally {
            setIsVoting(false)
        }
    }

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            if (
                confirm(
                    "You need to be signed in to favorite loadouts. Go to login page?"
                )
            ) {
                router.push("/auth/login")
            }
            return
        }

        setIsTogglingFavorite(true)
        const supabase = createClient()

        try {
            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("User not authenticated")
            }

            if (isFavorited) {
                // Remove from favorites
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("loadout_id", loadout.id)

                if (error) throw error
                setIsFavorited(false)
            } else {
                // Add to favorites
                const { error } = await supabase.from("favorites").insert({
                    user_id: user.id,
                    loadout_id: loadout.id,
                })

                if (error) throw error
                setIsFavorited(true)
            }
        } catch (error) {
            console.error("Error toggling favorite:", error)
            alert("Failed to update favorite. Please try again.")
        } finally {
            setIsTogglingFavorite(false)
        }
    }

    const handleClone = async () => {
        if (!isAuthenticated) {
            if (
                confirm(
                    "You need to be signed in to clone loadouts. Go to login page?"
                )
            ) {
                router.push("/auth/login")
            }
            return
        }

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
                throw new Error("User not authenticated")
            }

            // Create a copy of the loadout with new name
            const clonedLoadout = {
                user_id: user.id,
                name: newName.trim(),
                game_mode: loadout.game_mode,
                is_public: false, // Clones start as private
                creator_username:
                    user.user_metadata?.username ||
                    `@${user.id.substring(0, 8)}`,
                helmet: loadout.helmet,
                chest: loadout.chest,
                legs: loadout.legs,
                accessories: loadout.accessories,
                weapons: loadout.weapons,
                buffs: loadout.buffs,
                version_tag: loadout.version_tag,
                video_link: loadout.video_link,
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
        } finally {
            setIsCloning(false)
        }
    }

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full p-4'>
                {/* Header */}
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-foreground uppercase break-words min-w-0 max-w-full'>
                        {loadout.name}
                    </h1>
                    <div className='flex gap-2 flex-wrap'>
                        {/* Vote Buttons */}
                        <div className='flex gap-1 items-center card-dark border-2 border-dark rounded px-2'>
                            <button
                                onClick={() => handleVote(1)}
                                disabled={isVoting}
                                className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                                    userVote === 1
                                        ? "bg-green-600 text-foreground"
                                        : "text-gray-400 hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                                } disabled:opacity-50`}
                                title='Upvote'>
                                <svg
                                    className='w-4 h-4'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'>
                                    <path d='M12 4l8 8h-6v8h-4v-8H4z' />
                                </svg>
                            </button>
                            <span
                                className={`px-2 font-bold text-sm ${
                                    voteScore > 0
                                        ? "text-green-400"
                                        : voteScore < 0
                                        ? "text-red-400"
                                        : "text-gray-400"
                                }`}>
                                {voteScore > 0 ? `+${voteScore}` : voteScore}
                            </span>
                            <button
                                onClick={() => handleVote(-1)}
                                disabled={isVoting}
                                className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                                    userVote === -1
                                        ? "bg-red-600 text-foreground"
                                        : "text-gray-400 hover:text-red-400 hover:bg-red-900/30"
                                } disabled:opacity-50`}
                                title='Downvote'>
                                <svg
                                    className='w-4 h-4'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'>
                                    <path d='M12 20l-8-8h6V4h4v8h6z' />
                                </svg>
                            </button>
                        </div>

                        {isAuthenticated ? (
                            <button
                                onClick={handleToggleFavorite}
                                disabled={isTogglingFavorite}
                                className={`px-4 py-2 border-2 rounded text-sm font-semibold transition-all whitespace-nowrap ${
                                    isFavorited
                                        ? "bg-yellow-600/50 hover:bg-yellow-500/50 border-yellow-500 text-foreground"
                                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 border-gray-400 dark:border-gray-600 text-foreground"
                                } disabled:opacity-50`}>
                                {isFavorited ? "★ Favorited" : "☆ Favorite"}
                            </button>
                        ) : (
                            <Link
                                href='/auth/login'
                                className='px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 border-2 border-gray-400 dark:border-gray-600 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                                Sign in to Favorite
                            </Link>
                        )}
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
                            href='/loadouts'
                            className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                            Back to Browse
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
                                                                armor[index]!
                                                                    .name,
                                                                armor[index]!
                                                                    .mod,
                                                                48
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <div className='text-2xl text-gray-500'>
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
                                                                      .rarity ||
                                                                      0
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

                        {/* Buffs Section */}
                        {buffs.length > 0 && (
                            <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                                <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                    Active Buffs
                                </h2>
                                <div className='grid grid-cols-3 gap-2'>
                                    {buffs.map((buff: Item, i: number) => (
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
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wider text-center'>
                                Weapons ({weapons.length})
                            </h2>
                            {weapons.length > 0 ? (
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center'>
                                    {weapons.map((weapon: Item, i: number) => (
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
                                    ))}
                                </div>
                            ) : (
                                <div className='text-center text-gray-500 py-8'>
                                    No weapons equipped
                                </div>
                            )}
                        </div>

                        {/* Accessories - Mobile Only */}
                        {accessories.length > 0 && (
                            <div className='lg:hidden bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                                <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider text-center'>
                                    Accessories ({accessories.length})
                                </h2>
                                <div className='space-y-2'>
                                    {accessories.map(
                                        (accessory: Item, i: number) => (
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
                                                            accessory.rarity ||
                                                                0
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
                                {loadout.creator_username &&
                                    loadout.user_id && (
                                        <div className='flex justify-between items-center pb-2 border-b border-dark'>
                                            <span className='text-gray-400'>
                                                Created By:
                                            </span>
                                            <Link
                                                href={`/users/${loadout.user_id}`}
                                                className='text-yellow-300 hover:text-yellow-200 font-semibold hover:underline transition-colors'>
                                                {loadout.creator_username}
                                            </Link>
                                        </div>
                                    )}
                                {loadout.version_tag && (
                                    <div className='flex justify-between items-center'>
                                        <span className='text-gray-400'>
                                            Version:
                                        </span>
                                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700'>
                                            {loadout.version_tag}
                                        </span>
                                    </div>
                                )}
                                <div className='flex justify-between items-center'>
                                    <span className='text-gray-400'>Mods:</span>
                                    <div className='flex gap-1 flex-wrap justify-end'>
                                        {loadout.game_mode === "vanilla" ? (
                                            <Link
                                                href='/loadouts?mod=vanilla'
                                                className='text-cyan-400 hover:text-cyan-300 hover:underline transition-colors'>
                                                Vanilla
                                            </Link>
                                        ) : (
                                            (() => {
                                                const allItems = [
                                                    ...weapons,
                                                    ...accessories,
                                                    ...buffs,
                                                    helmet,
                                                    chest,
                                                    legs,
                                                ].filter(Boolean)
                                                const mods = new Set<string>()
                                                allItems.forEach((item) => {
                                                    if (
                                                        item?.mod === "calamity"
                                                    )
                                                        mods.add("calamity")
                                                    if (item?.mod === "thorium")
                                                        mods.add("thorium")
                                                })

                                                if (mods.size === 0) {
                                                    return (
                                                        <Link
                                                            href='/loadouts?mod=vanilla'
                                                            className='text-cyan-400 hover:text-cyan-300 hover:underline transition-colors'>
                                                            Vanilla
                                                        </Link>
                                                    )
                                                }

                                                return Array.from(mods).map(
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
                                            })()
                                        )}
                                    </div>
                                </div>
                                {loadout.target_boss && (
                                    <div>
                                        <span className='text-gray-400 block mb-2'>
                                            Target Boss:
                                        </span>
                                        <div className='flex flex-wrap gap-2'>
                                            {loadout.target_boss
                                                .split(" | ")
                                                .map((bossName) => {
                                                    // Determine boss mod from imported boss data
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
                                                        (b) =>
                                                            b.name === bossName
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
                                                                onError={(
                                                                    e
                                                                ) => {
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
                                    <span className='text-gray-400'>
                                        Created:
                                    </span>
                                    <span className='text-cyan-400'>
                                        {new Date(
                                            loadout.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                {loadout.updated_at &&
                                    loadout.updated_at !==
                                        loadout.created_at && (
                                        <div className='flex justify-between'>
                                            <span className='text-gray-400'>
                                                Updated:
                                            </span>
                                            <span className='text-cyan-400'>
                                                {new Date(
                                                    loadout.updated_at
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                {(loadout.view_count || 0) > 0 && (
                                    <div className='flex justify-between'>
                                        <span className='text-gray-400'>
                                            Views:
                                        </span>
                                        <span className='text-cyan-400'>
                                            {loadout.view_count?.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Creator's Other Loadouts */}
                        {creatorLoadouts.length > 0 && (
                            <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                                <h3 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                    More from{" "}
                                    {loadout.creator_username || "this creator"}
                                </h3>
                                <div className='space-y-2'>
                                    {creatorLoadouts.map((other) => (
                                        <Link
                                            key={other.id}
                                            href={`/loadouts/${other.id}`}
                                            className='block p-2 bg-background dark:bg-[#0a0e1f] border border-border dark:border-[#1a2a4a] rounded hover:border-cyan-500 transition-colors'>
                                            <div className='text-sm text-foreground font-medium truncate'>
                                                {other.name}
                                            </div>
                                            <div className='flex gap-3 text-xs text-gray-400 mt-1'>
                                                {other.view_count > 0 && (
                                                    <span>
                                                        👁 {other.view_count}
                                                    </span>
                                                )}
                                                {other.vote_score !== 0 && (
                                                    <span>
                                                        {other.vote_score > 0
                                                            ? "👍"
                                                            : "👎"}{" "}
                                                        {Math.abs(
                                                            other.vote_score
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {loadout.user_id && (
                                    <Link
                                        href={`/users/${loadout.user_id}`}
                                        className='block mt-3 text-center text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors'>
                                        View all →
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Video Embed */}
                        {loadout.video_link && (
                            <YouTubeEmbed
                                url={loadout.video_link}
                                title={`${loadout.name} - Video Guide`}
                            />
                        )}
                    </div>

                    {/* Right Panel - Accessories (Desktop Only) */}
                    <div className='hidden lg:block space-y-4'>
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider text-center'>
                                Accessories ({accessories.length})
                            </h2>
                            {accessories.length > 0 ? (
                                <div className='space-y-2'>
                                    {accessories.map(
                                        (accessory: Item, i: number) => (
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
                                                            accessory.rarity ||
                                                                0
                                                        )}`}>
                                                        {accessory.name}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className='text-center text-gray-500 py-4'>
                                    No accessories equipped
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
