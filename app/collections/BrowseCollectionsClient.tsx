"use client"

import { useState, useMemo } from "react"
import Link from "next/link"

interface Collection {
    id: string
    name: string
    description: string | null
    is_public: boolean
    created_at: string
    user_id: string
    loadout_count: number
    view_count?: number
    vote_score?: number
}

export default function BrowseCollectionsClient({
    initialCollections,
    isAuthenticated,
}: {
    initialCollections: Collection[]
    isAuthenticated: boolean
}) {
    const [collections] = useState<Collection[]>(initialCollections)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")

    // Filter and sort collections
    const filteredCollections = useMemo(() => {
        let filtered = [...collections]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (col) =>
                    col.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    col.description
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
            )
        }

        // Sort
        if (sortBy === "recent") {
            filtered.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
            )
        } else if (sortBy === "popular") {
            filtered.sort((a, b) => b.loadout_count - a.loadout_count)
        }

        return filtered
    }, [collections, searchQuery, sortBy])

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full p-6'>
                {/* Header */}
                <div className='mb-6'>
                    <div className='flex justify-between items-start mb-4'>
                        <div>
                            <h1 className='text-3xl font-bold text-yellow-400 mb-2'>
                                Browse Collections
                            </h1>
                            <p className='text-gray-700 dark:text-gray-400'>
                                Explore public loadout collections from the
                                community
                            </p>
                        </div>
                        {isAuthenticated && (
                            <Link
                                href='/my-collections'
                                className='px-4 py-2 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border-2 border-cyan-400 rounded-lg font-semibold text-foreground transition-all'>
                                My Collections
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <input
                            type='text'
                            placeholder='Search collections...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='flex-1 px-4 py-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors'
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className='px-4 py-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer'>
                            <option value='recent'>Most Recent</option>
                            <option value='popular'>Most Popular</option>
                        </select>
                    </div>
                </div>

                {/* Collections Grid */}
                {filteredCollections.length === 0 ? (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-12 text-center'>
                        <p className='text-gray-700 dark:text-gray-400 mb-4'>
                            {searchQuery
                                ? "No collections found matching your search"
                                : "No public collections available yet"}
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {filteredCollections.map((collection) => (
                            <Link
                                key={collection.id}
                                href={`/collections/${collection.id}`}
                                className='block bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-cyan-500 transition-colors group'>
                                <h3 className='text-lg font-bold text-yellow-400 group-hover:text-yellow-300 mb-2 transition-colors break-words'>
                                    {collection.name}
                                </h3>
                                {collection.description && (
                                    <p className='text-sm text-gray-700 dark:text-gray-400 mb-3 line-clamp-2 break-words'>
                                        {collection.description}
                                    </p>
                                )}
                                <div className='flex justify-between items-center text-sm text-gray-700 dark:text-gray-400 mb-2'>
                                    <span>
                                        📦 {collection.loadout_count} loadout
                                        {collection.loadout_count !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                    <div className='flex gap-3'>
                                        {collection.view_count !== undefined &&
                                            collection.view_count > 0 && (
                                                <span>
                                                    👁 {collection.view_count}
                                                </span>
                                            )}
                                        {collection.vote_score !== undefined &&
                                            collection.vote_score !== 0 && (
                                                <span>
                                                    {collection.vote_score > 0
                                                        ? "👍"
                                                        : "👎"}{" "}
                                                    {Math.abs(
                                                        collection.vote_score
                                                    )}
                                                </span>
                                            )}
                                    </div>
                                </div>
                                <div className='text-xs text-gray-600 dark:text-gray-500'>
                                    {new Date(
                                        collection.created_at
                                    ).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
