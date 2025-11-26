"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
    is_public: boolean
    view_count?: number
    vote_score?: number
}

export default function LoadoutsClient({
    initialLoadouts,
    isAuthenticated,
}: {
    initialLoadouts: Loadout[]
    isAuthenticated: boolean
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loadouts, setLoadouts] = useState<Loadout[]>(initialLoadouts)
    const [searchQuery, setSearchQuery] = useState("")
    const [modFilter, setModFilter] = useState<string>(
        searchParams.get("mod") || "all"
    )
    const [tagFilter, setTagFilter] = useState<string>(
        searchParams.get("tag") || ""
    )
    const [sortBy, setSortBy] = useState<string>("newest")
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [popularTags, setPopularTags] = useState<
        Array<{ name: string; count: number }>
    >([])
    const supabase = createClient()

    // Fetch popular tags - disabled (tags feature removed)
    useEffect(() => {
        // Tags feature has been removed from the database
        setPopularTags([])
    }, [supabase])

    // Update filter when URL changes
    useEffect(() => {
        const mod = searchParams.get("mod")
        const tag = searchParams.get("tag")
        if (mod) {
            setModFilter(mod)
        }
        if (tag) {
            setTagFilter(tag)
            handleTagFilter(tag)
        }
    }, [searchParams])

    const handleTagFilter = async (tag: string) => {
        setTagFilter(tag)
        setPage(0)
        setHasMore(true)
        setLoading(true)

        try {
            // Tags feature disabled - skip tag filtering
            setLoadouts([])
            setHasMore(false)
        } catch (error) {
            console.error("Error filtering by tag:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return

        setLoading(true)
        const offset = (page + 1) * 20

        try {
            let query = supabase
                .from("loadouts")
                .select("*")
                .eq("is_public", true)

            // Apply sorting
            switch (sortBy) {
                case "newest":
                    query = query.order("created_at", { ascending: false })
                    break
                case "views":
                    query = query.order("view_count", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "votes":
                    query = query.order("vote_score", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "favorites":
                    // For favorites, we'll need to join or use a different approach
                    // For now, fall back to newest
                    query = query.order("created_at", { ascending: false })
                    break
            }

            query = query.range(offset, offset + 19)

            if (searchQuery) {
                query = query.ilike("name", `%${searchQuery}%`)
            }

            const { data, error } = await query

            if (error) throw error

            if (data && data.length > 0) {
                setLoadouts((prev) => [...prev, ...data])
                setPage((p) => p + 1)
                if (data.length < 20) {
                    setHasMore(false)
                }
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error loading more loadouts:", error)
        } finally {
            setLoading(false)
        }
    }, [loading, hasMore, page, searchQuery, sortBy, supabase])

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        setPage(0)
        setHasMore(true)
        setLoading(true)

        try {
            let queryBuilder = supabase
                .from("loadouts")
                .select("*")
                .eq("is_public", true)

            // Apply sorting
            switch (sortBy) {
                case "newest":
                    queryBuilder = queryBuilder.order("created_at", {
                        ascending: false,
                    })
                    break
                case "views":
                    queryBuilder = queryBuilder.order("view_count", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "votes":
                    queryBuilder = queryBuilder.order("vote_score", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "favorites":
                    queryBuilder = queryBuilder.order("created_at", {
                        ascending: false,
                    })
                    break
            }

            queryBuilder = queryBuilder.range(0, 19)

            if (query) {
                queryBuilder = queryBuilder.ilike("name", `%${query}%`)
            }

            const { data, error } = await queryBuilder

            if (error) throw error

            setLoadouts(data || [])
            if (!data || data.length < 20) {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error searching loadouts:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSortChange = async (newSortBy: string) => {
        setSortBy(newSortBy)
        setPage(0)
        setHasMore(true)
        setLoading(true)

        try {
            let queryBuilder = supabase
                .from("loadouts")
                .select("*")
                .eq("is_public", true)

            // Apply sorting
            switch (newSortBy) {
                case "newest":
                    queryBuilder = queryBuilder.order("created_at", {
                        ascending: false,
                    })
                    break
                case "views":
                    queryBuilder = queryBuilder.order("view_count", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "votes":
                    queryBuilder = queryBuilder.order("vote_score", {
                        ascending: false,
                        nullsFirst: false,
                    })
                    break
                case "favorites":
                    queryBuilder = queryBuilder.order("created_at", {
                        ascending: false,
                    })
                    break
            }

            queryBuilder = queryBuilder.range(0, 19)

            if (searchQuery) {
                queryBuilder = queryBuilder.ilike("name", `%${searchQuery}%`)
            }

            const { data, error } = await queryBuilder

            if (error) throw error

            setLoadouts(data || [])
            if (!data || data.length < 20) {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error sorting loadouts:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                    document.body.offsetHeight - 500 &&
                !loading &&
                hasMore
            ) {
                loadMore()
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [loadMore, loading, hasMore])

    return (
        <div className='max-w-[1400px] mx-auto w-full p-4'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6'>
                <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>
                    Browse Loadouts
                </h1>
                <Link
                    href='/loadouts/create'
                    className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                    Create Loadout
                </Link>
            </div>

            {/* Search Bar */}
            <div className='mb-6 flex flex-col sm:flex-row gap-4'>
                <input
                    type='text'
                    placeholder='Search loadouts by name...'
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className='flex-1 px-4 py-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors'
                />
                <select
                    value={modFilter}
                    onChange={(e) => {
                        setModFilter(e.target.value)
                        handleSearch(searchQuery)
                    }}
                    className='px-4 py-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer'>
                    <option value='all'>All Mods</option>
                    <option value='vanilla'>Vanilla Only</option>
                    <option value='calamity'>Calamity</option>
                    <option value='thorium'>Thorium</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className='px-4 py-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer'>
                    <option value='newest'>Newest First</option>
                    <option value='views'>Most Viewed</option>
                    <option value='votes'>Highest Rated</option>
                    <option value='favorites'>Most Favorited</option>
                </select>
            </div>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
                <div className='mb-6 bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                    <h3 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                        Popular Tags
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                        {popularTags.map(({ name, count }) => (
                            <button
                                key={name}
                                onClick={() => handleTagFilter(name)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    tagFilter === name
                                        ? "bg-cyan-600 text-foreground border-2 border-cyan-400"
                                        : "bg-cyan-900/50 text-cyan-300 border border-cyan-700 hover:bg-cyan-800/50"
                                }`}>
                                {name}
                                <span className='text-xs opacity-75'>
                                    ({count})
                                </span>
                            </button>
                        ))}
                        {tagFilter && (
                            <button
                                onClick={() => {
                                    setTagFilter("")
                                    handleSearch(searchQuery)
                                }}
                                className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700 hover:bg-red-800/50 transition-colors'>
                                Clear Tag Filter ×
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Loadouts Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {loadouts
                    .filter((loadout) => {
                        // Filter by mod
                        if (modFilter === "all") return true
                        if (modFilter === "vanilla")
                            return loadout.game_mode === "vanilla"

                        // For calamity/thorium, check if any items use that mod
                        const allItems = [
                            ...(Array.isArray(loadout.weapons)
                                ? loadout.weapons
                                : []),
                            ...(Array.isArray(loadout.accessories)
                                ? loadout.accessories
                                : []),
                            loadout.helmet,
                            loadout.chest,
                            loadout.legs,
                        ].filter(Boolean)

                        return allItems.some(
                            (item: any) => item?.mod === modFilter
                        )
                    })
                    .map((loadout) => {
                        const weaponCount = Array.isArray(loadout.weapons)
                            ? loadout.weapons.length
                            : 0
                        const accessoryCount = Array.isArray(
                            loadout.accessories
                        )
                            ? loadout.accessories.length
                            : 0

                        // Detect mods used
                        const getUsedMods = () => {
                            if (loadout.game_mode === "vanilla") {
                                return "Vanilla"
                            }

                            const allItems = [
                                ...(Array.isArray(loadout.weapons)
                                    ? loadout.weapons
                                    : []),
                                ...(Array.isArray(loadout.accessories)
                                    ? loadout.accessories
                                    : []),
                                loadout.helmet,
                                loadout.chest,
                                loadout.legs,
                            ].filter(Boolean)

                            const mods = new Set<string>()
                            allItems.forEach((item: any) => {
                                if (item?.mod === "calamity")
                                    mods.add("Calamity")
                                if (item?.mod === "thorium") mods.add("Thorium")
                            })

                            if (mods.size === 0) {
                                return "Vanilla"
                            }

                            return Array.from(mods).join(", ")
                        }

                        return (
                            <Link
                                key={loadout.id}
                                href={`/loadouts/${loadout.id}`}
                                className='block bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-yellow-500 transition-all cursor-pointer'>
                                <h3 className='font-bold text-lg text-yellow-400 mb-2 break-words'>
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
                                            .map((w, i) => (
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
                                        <span>{getUsedMods()}</span>
                                        <span>{weaponCount} weapons</span>
                                        <span>
                                            {accessoryCount} accessories
                                        </span>
                                    </div>
                                </div>

                                <div className='flex justify-between items-center text-xs mt-2'>
                                    <div className='flex gap-3 text-gray-500'>
                                        <span>
                                            {new Date(
                                                loadout.created_at
                                            ).toLocaleDateString()}
                                        </span>
                                        {(loadout.view_count || 0) > 0 && (
                                            <span className='flex items-center gap-1'>
                                                <svg
                                                    className='w-3 h-3'
                                                    fill='currentColor'
                                                    viewBox='0 0 24 24'>
                                                    <path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' />
                                                </svg>
                                                {loadout.view_count}
                                            </span>
                                        )}
                                        {loadout.vote_score !== undefined &&
                                            loadout.vote_score !== 0 && (
                                                <span
                                                    className={`flex items-center gap-1 ${
                                                        loadout.vote_score > 0
                                                            ? "text-green-400"
                                                            : "text-red-400"
                                                    }`}>
                                                    <svg
                                                        className='w-3 h-3'
                                                        fill='currentColor'
                                                        viewBox='0 0 24 24'>
                                                        <path
                                                            d={
                                                                loadout.vote_score >
                                                                0
                                                                    ? "M12 4l8 8h-6v8h-4v-8H4z"
                                                                    : "M12 20l-8-8h6V4h4v8h6z"
                                                            }
                                                        />
                                                    </svg>
                                                    {Math.abs(
                                                        loadout.vote_score
                                                    )}
                                                </span>
                                            )}
                                    </div>
                                    {(loadout as any).creator_username && (
                                        <span
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                router.push(
                                                    `/users/${
                                                        (loadout as any).user_id
                                                    }`
                                                )
                                            }}
                                            className='text-yellow-300/70 hover:text-yellow-300 hover:underline transition-colors cursor-pointer'>
                                            by{" "}
                                            {(loadout as any).creator_username}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className='text-center py-8'>
                    <div className='inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin'></div>
                    <p className='text-gray-400 mt-2'>Loading more...</p>
                </div>
            )}

            {/* No more results */}
            {!hasMore && loadouts.length > 0 && (
                <div className='text-center py-8 text-gray-400'>
                    No more loadouts to load
                </div>
            )}

            {/* No results */}
            {!loading && loadouts.length === 0 && (
                <div className='text-center py-12'>
                    <p className='text-gray-400 text-lg'>
                        {searchQuery
                            ? "No loadouts found matching your search"
                            : "No public loadouts yet"}
                    </p>
                    <Link
                        href='/loadouts/create'
                        className='inline-block mt-4 px-6 py-3 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border-2 border-cyan-400 rounded-lg font-bold text-foreground uppercase tracking-wide text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(6,182,212,0.5)] transition-all'>
                        Create the First Loadout
                    </Link>
                </div>
            )}
        </div>
    )
}
