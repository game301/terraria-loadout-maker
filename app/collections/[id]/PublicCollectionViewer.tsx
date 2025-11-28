"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import YouTubeEmbed from "@/components/YouTubeEmbed"

interface Collection {
    id: string
    name: string
    description: string | null
    is_public: boolean
    user_id: string
    video_url?: string | null
    view_count?: number
    vote_score?: number
    created_at?: string
    updated_at?: string
}

interface LoadoutInCollection {
    id: string
    loadout_id: string
    position: number
    loadouts: {
        id: string
        name: string
        game_mode: string
        view_count: number
        vote_score: number
        helmet: any
        chest: any
        legs: any
        weapons: any[]
        accessories: any[]
        target_boss: string
    }
}

export default function PublicCollectionViewer({
    collection,
    isAuthenticated,
    initialIsFavorited = false,
    initialUserVote = 0,
}: {
    collection: Collection
    isAuthenticated: boolean
    initialIsFavorited?: boolean
    initialUserVote?: number
}) {
    const router = useRouter()
    const [loadouts, setLoadouts] = useState<LoadoutInCollection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
    const [userVote, setUserVote] = useState(initialUserVote)
    const [voteScore, setVoteScore] = useState(collection.vote_score || 0)
    const [copySuccess, setCopySuccess] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
    const [isCloning, setIsCloning] = useState(false)

    useEffect(() => {
        fetchLoadouts()
    }, [])

    const fetchLoadouts = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from("collection_loadouts")
            .select(
                `
                id,
                loadout_id,
                position,
                loadouts(id, name, game_mode, view_count, vote_score, helmet, chest, legs, weapons, accessories, target_boss)
            `
            )
            .eq("collection_id", collection.id)
            .order("position", { ascending: true })

        if (!error && data) {
            setLoadouts(data as any)
        }
        setIsLoading(false)
    }

    const getModsUsed = (loadout: LoadoutInCollection["loadouts"]) => {
        const mods = new Set<string>()
        const items = [
            loadout.helmet,
            loadout.chest,
            loadout.legs,
            ...(loadout.weapons || []),
            ...(loadout.accessories || []),
        ].filter(Boolean)

        items.forEach((item: any) => {
            if (item?.mod && item.mod !== "vanilla") {
                mods.add(item.mod)
            }
        })
        return Array.from(mods)
    }

    const handleVote = async (vote: number) => {
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
            if (!user) throw new Error("Not authenticated")

            // Check current vote
            const { data: existingVote } = await supabase
                .from("collection_votes")
                .select("vote")
                .eq("user_id", user.id)
                .eq("collection_id", collection.id)
                .single()

            if (existingVote && existingVote.vote === vote) {
                // Remove vote
                await supabase
                    .from("collection_votes")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("collection_id", collection.id)

                setUserVote(0)
                setVoteScore((prev) => prev - vote)
            } else {
                // Add or update vote
                await supabase.from("collection_votes").upsert({
                    user_id: user.id,
                    collection_id: collection.id,
                    vote: vote,
                })

                const oldVote = existingVote ? existingVote.vote : 0
                setUserVote(vote)
                setVoteScore((prev) => prev - oldVote + vote)
            }
        } catch (error) {
            console.error("Error voting:", error)
            alert("Failed to vote. Please try again.")
        } finally {
            setIsVoting(false)
        }
    }

    const handleFavorite = async () => {
        if (!isAuthenticated) {
            if (
                confirm(
                    "You need to be signed in to favorite. Go to login page?"
                )
            ) {
                router.push("/auth/login")
            }
            return
        }

        setIsTogglingFavorite(true)
        const supabase = createClient()

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            if (isFavorited) {
                await supabase
                    .from("collection_favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("collection_id", collection.id)

                setIsFavorited(false)
            } else {
                await supabase.from("collection_favorites").insert({
                    user_id: user.id,
                    collection_id: collection.id,
                })

                setIsFavorited(true)
            }
        } catch (error) {
            console.error("Error toggling favorite:", error)
            alert("Failed to update favorite. Please try again.")
        } finally {
            setIsTogglingFavorite(false)
        }
    }

    const handleCopyShareUrl = () => {
        const shareUrl = `${window.location.origin}/collections/${collection.id}`
        navigator.clipboard.writeText(shareUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    const handleCloneCollection = async () => {
        if (!isAuthenticated) {
            if (
                confirm("You need to be signed in to clone. Go to login page?")
            ) {
                router.push("/auth/login")
            }
            return
        }

        const newName = prompt(
            "Enter name for cloned collection:",
            `${collection.name} (Copy)`
        )
        if (!newName?.trim()) return

        setIsCloning(true)
        const supabase = createClient()

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Create new collection
            const { data: newCollection, error: collectionError } =
                await supabase
                    .from("collections")
                    .insert({
                        user_id: user.id,
                        name: newName.trim(),
                        description: collection.description,
                        is_public: false,
                        video_url: collection.video_url,
                    })
                    .select()
                    .single()

            if (collectionError || !newCollection) throw collectionError

            // Copy all loadouts
            if (loadouts.length > 0) {
                const loadoutInserts = loadouts.map((item, index) => ({
                    collection_id: newCollection.id,
                    loadout_id: item.loadout_id,
                    position: index,
                }))

                const { error: loadoutsError } = await supabase
                    .from("collection_loadouts")
                    .insert(loadoutInserts)

                if (loadoutsError) throw loadoutsError
            }

            alert("Collection cloned successfully!")
            router.push(`/my-collections/${newCollection.id}`)
        } catch (error) {
            console.error("Error cloning collection:", error)
            alert("Failed to clone collection. Please try again.")
        } finally {
            setIsCloning(false)
        }
    }

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full p-4'>
                {/* Header */}
                <div className='mb-6'>
                    <div className='flex flex-col lg:flex-row justify-between items-start gap-4'>
                        <div className='flex-1 min-w-0 max-w-full'>
                            <h1 className='text-2xl sm:text-3xl font-bold text-foreground uppercase break-words overflow-wrap-anywhere'>
                                {collection.name}
                            </h1>
                            {collection.description && (
                                <p className='text-gray-400 mt-2 break-words'>
                                    {collection.description}
                                </p>
                            )}
                            <div className='flex flex-wrap gap-3 text-xs text-gray-500 mt-2'>
                                {collection.created_at && (
                                    <span>
                                        Created:{" "}
                                        {new Date(
                                            collection.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                                {collection.updated_at &&
                                    collection.updated_at !==
                                        collection.created_at && (
                                        <span>
                                            • Updated:{" "}
                                            {new Date(
                                                collection.updated_at
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                {collection.view_count !== undefined &&
                                    collection.view_count > 0 && (
                                        <span>
                                            • 👁{" "}
                                            {collection.view_count.toLocaleString()}{" "}
                                            {collection.view_count === 1
                                                ? "view"
                                                : "views"}
                                        </span>
                                    )}
                            </div>
                        </div>
                        <div className='flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end'>
                            {/* Vote Buttons */}
                            <div className='flex gap-1 items-center card-dark border-2 border-dark rounded px-2'>
                                <button
                                    onClick={() => handleVote(1)}
                                    disabled={isVoting || !isAuthenticated}
                                    className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                                        userVote === 1
                                            ? "bg-green-600 text-foreground"
                                            : "text-gray-400 hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                    {voteScore > 0
                                        ? `+${voteScore}`
                                        : voteScore}
                                </span>
                                <button
                                    onClick={() => handleVote(-1)}
                                    disabled={isVoting || !isAuthenticated}
                                    className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                                        userVote === -1
                                            ? "bg-red-600 text-foreground"
                                            : "text-gray-400 hover:text-red-400 hover:bg-red-900/30"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                    onClick={handleFavorite}
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
                                onClick={handleCopyShareUrl}
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
                                onClick={handleCloneCollection}
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
                                href='/collections'
                                className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                                Back to Browse
                            </Link>
                        </div>
                    </div>
                </div>

                {copySuccess && (
                    <div className='fixed top-20 right-4 px-6 py-3 bg-green-600 border-2 border-green-400 rounded-lg font-semibold text-foreground shadow-lg z-50'>
                        ✓ Link copied to clipboard!
                    </div>
                )}

                {isLoading ? (
                    <div className='text-center text-gray-400 py-12'>
                        Loading...
                    </div>
                ) : loadouts.length === 0 ? (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-12 text-center'>
                        <p className='text-gray-700 dark:text-gray-400'>
                            This collection is empty
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {loadouts.map((item) => {
                                const mods = getModsUsed(item.loadouts)
                                return (
                                    <Link
                                        key={item.id}
                                        href={`/loadouts/${item.loadout_id}`}
                                        className='block bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-cyan-500 transition-colors group'>
                                        <h3 className='text-lg font-bold text-yellow-400 group-hover:text-yellow-300 mb-2 transition-colors'>
                                            {item.loadouts.name}
                                        </h3>
                                        <div className='flex justify-between items-center text-sm text-gray-700 dark:text-gray-400 mb-2'>
                                            <span className='capitalize'>
                                                {item.loadouts.game_mode}
                                            </span>
                                            <div className='flex gap-3'>
                                                {item.loadouts.view_count >
                                                    0 && (
                                                    <span>
                                                        👁{" "}
                                                        {
                                                            item.loadouts
                                                                .view_count
                                                        }
                                                    </span>
                                                )}
                                                {item.loadouts.vote_score !==
                                                    0 && (
                                                    <span>
                                                        {item.loadouts
                                                            .vote_score > 0
                                                            ? "👍"
                                                            : "👎"}{" "}
                                                        {Math.abs(
                                                            item.loadouts
                                                                .vote_score
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {mods.length > 0 && (
                                            <div className='flex flex-wrap gap-1 mb-2'>
                                                {mods.map((mod) => (
                                                    <span
                                                        key={mod}
                                                        className='px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-500 dark:border-purple-700 rounded text-xs font-medium capitalize'>
                                                        {mod}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {item.loadouts.target_boss && (
                                            <div className='text-xs text-gray-600 dark:text-gray-500'>
                                                🎯 {item.loadouts.target_boss}
                                            </div>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Video Embed */}
                {collection.video_url && (
                    <div className='mt-6 max-w-3xl mx-auto'>
                        <YouTubeEmbed
                            url={collection.video_url}
                            title={`${collection.name} - Video Guide`}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
