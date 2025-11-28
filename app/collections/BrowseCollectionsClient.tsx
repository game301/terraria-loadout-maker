"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { PageButton } from "@/components/ui/page-button"

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
            <div className='max-w-7xl mx-auto w-full p-4'>
                {/* Header */}
                <div className='mb-6'>
                    <div className='flex justify-between items-start mb-4'>
                        <div>
                            <h1 className='text-3xl font-bold text-[hsl(var(--page-heading))] mb-2'>
                                Browse Collections
                            </h1>
                            <p className='text-[hsl(var(--page-text-muted))]'>
                                Explore public loadout collections from the
                                community
                            </p>
                        </div>
                        {isAuthenticated && (
                            <PageButton href='/my-collections'>
                                My Collections
                            </PageButton>
                        )}
                    </div>

                    {/* Filters */}
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <input
                            type='text'
                            placeholder='Search collections...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='flex-1 px-4 py-3 bg-[hsl(var(--input))] border-2 border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--ring))] transition-colors'
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className='px-4 py-3 bg-[hsl(var(--input))] border-2 border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--ring))] transition-colors cursor-pointer'>
                            <option value='recent'>Most Recent</option>
                            <option value='popular'>Most Popular</option>
                        </select>
                    </div>
                </div>

                {/* Collections Grid */}
                {filteredCollections.length === 0 ? (
                    <div className='bg-[hsl(var(--card-bg))] border-2 border-[hsl(var(--card-border))] rounded-lg p-12 text-center'>
                        <p className='text-[hsl(var(--page-text-muted))] mb-4'>
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
                                className='block bg-[hsl(var(--card-bg))] border-2 border-[hsl(var(--card-border))] rounded-lg p-4 hover:border-[hsl(var(--card-hover-border))] transition-colors group'>
                                <h3 className='text-lg font-bold text-[hsl(var(--card-heading))] group-hover:text-[hsl(var(--card-hover-border))] mb-2 transition-colors break-words'>
                                    {collection.name}
                                </h3>
                                {collection.description && (
                                    <p className='text-sm text-[hsl(var(--page-text-muted))] mb-3 line-clamp-2 break-words'>
                                        {collection.description}
                                    </p>
                                )}
                                <div className='flex justify-between items-center text-sm text-[hsl(var(--page-text-muted))] mb-2'>
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
                                <div className='text-xs text-[hsl(var(--page-text-muted))]'>
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
