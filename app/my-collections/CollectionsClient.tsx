"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"

interface Collection {
    id: string
    name: string
    description: string | null
    is_public: boolean
    created_at: string
    loadout_count?: number
}

export default function CollectionsClient({ user }: { user: User }) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        fetchCollections()
    }, [])

    const fetchCollections = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from("collections")
            .select(
                `
                id,
                name,
                description,
                is_public,
                created_at,
                collection_loadouts(count)
            `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (!error && data) {
            const collectionsWithCount = data.map((col: any) => ({
                ...col,
                loadout_count: col.collection_loadouts?.[0]?.count || 0,
            }))
            setCollections(collectionsWithCount)
        }
        setIsLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsCreating(true)
        const supabase = createClient()

        const { error } = await supabase.from("collections").insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            is_public: isPublic,
        })

        if (!error) {
            setName("")
            setDescription("")
            setIsPublic(false)
            setShowCreateForm(false)
            fetchCollections()
        } else {
            alert("Failed to create collection")
        }
        setIsCreating(false)
    }

    const handleDelete = async (id: string, collectionName: string) => {
        if (!confirm(`Delete collection "${collectionName}"?`)) return

        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", id)

        if (!error) {
            fetchCollections()
        } else {
            alert("Failed to delete collection")
        }
    }

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full p-4'>
                <div className='mb-6 flex justify-between items-center'>
                    <div>
                        <h1 className='text-3xl font-bold text-yellow-400 mb-2'>
                            My Collections
                        </h1>
                        <p className='text-gray-400'>
                            Organize your loadouts into collections
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className='px-4 py-2 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all'>
                        {showCreateForm ? "Cancel" : "+ New Collection"}
                    </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 mb-6'>
                        <h2 className='text-xl font-bold text-yellow-400 mb-4'>
                            Create Collection
                        </h2>
                        <form onSubmit={handleCreate} className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-2'>
                                    Name *
                                </label>
                                <input
                                    type='text'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder='e.g., Pre-Hardmode Builds'
                                    className='w-full px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500'
                                    required
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-2'>
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder='Optional description...'
                                    rows={3}
                                    className='w-full px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500 resize-none'
                                />
                            </div>
                            <div className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    id='is_public'
                                    checked={isPublic}
                                    onChange={(e) =>
                                        setIsPublic(e.target.checked)
                                    }
                                    className='w-4 h-4'
                                />
                                <label
                                    htmlFor='is_public'
                                    className='text-sm text-gray-400'>
                                    Make this collection public
                                </label>
                            </div>
                            <button
                                type='submit'
                                disabled={isCreating}
                                className='px-6 py-2 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 border-2 border-cyan-400 disabled:border-gray-500 rounded-lg font-semibold text-foreground transition-all disabled:cursor-not-allowed'>
                                {isCreating
                                    ? "Creating..."
                                    : "Create Collection"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Collections List */}
                {isLoading ? (
                    <div className='text-center text-gray-400 py-12'>
                        Loading...
                    </div>
                ) : collections.length === 0 ? (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-12 text-center'>
                        <p className='text-gray-400 mb-4'>
                            You haven't created any collections yet
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className='px-6 py-2 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all'>
                            Create Your First Collection
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                className='relative group h-full'>
                                <Link
                                    href={`/my-collections/${collection.id}`}
                                    className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 hover:border-cyan-500 transition-colors flex flex-col h-full'>
                                    <div className='flex justify-between items-start mb-3 gap-2'>
                                        <h3 className='text-lg font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors break-words min-w-0 flex-1'>
                                            {collection.name}
                                        </h3>
                                        {collection.is_public && (
                                            <span className='px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-500 dark:border-green-700 rounded text-xs font-medium shrink-0'>
                                                Public
                                            </span>
                                        )}
                                    </div>
                                    <div className='mb-3 min-h-[3rem]'>
                                        {collection.description && (
                                            <p className='text-sm text-gray-700 dark:text-gray-400 line-clamp-2 break-words'>
                                                {collection.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className='mt-auto'>
                                        <div className='flex justify-between items-center text-sm mb-2'>
                                            <span className='text-gray-700 dark:text-gray-400 flex items-center gap-1'>
                                                📦{" "}
                                                {collection.loadout_count || 0}{" "}
                                                {collection.loadout_count === 1
                                                    ? "loadout"
                                                    : "loadouts"}
                                            </span>
                                        </div>
                                        <div className='text-xs text-gray-600 dark:text-gray-500'>
                                            Created{" "}
                                            {new Date(
                                                collection.created_at
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete(
                                            collection.id,
                                            collection.name
                                        )
                                    }}
                                    className='absolute top-4 right-4 px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-400 rounded text-foreground font-medium transition-colors text-sm opacity-0 group-hover:opacity-100 z-10'>
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
