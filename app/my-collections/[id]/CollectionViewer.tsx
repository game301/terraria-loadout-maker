"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
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
    created_at?: string
    updated_at?: string
    view_count?: number
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
        created_at: string
        helmet: any
        chest: any
        legs: any
        weapons: any[]
        accessories: any[]
        target_boss: string
    }
}

export default function CollectionViewer({
    collection,
    user,
}: {
    collection: Collection
    user: User
}) {
    const router = useRouter()
    const [loadouts, setLoadouts] = useState<LoadoutInCollection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [availableLoadouts, setAvailableLoadouts] = useState<any[]>([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedLoadout, setSelectedLoadout] = useState("")
    const [sortBy, setSortBy] = useState<"custom" | "name" | "boss">("custom")
    const [draggedItem, setDraggedItem] = useState<string | null>(null)
    const [dragOverItem, setDragOverItem] = useState<string | null>(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const [videoUrl, setVideoUrl] = useState(collection.video_url || "")
    const [editingVideoUrl, setEditingVideoUrl] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [editingDescription, setEditingDescription] = useState(false)
    const [name, setName] = useState(collection.name)
    const [description, setDescription] = useState(collection.description || "")
    const [creatorCollections, setCreatorCollections] = useState<any[]>([])

    useEffect(() => {
        fetchLoadouts()
        fetchAvailableLoadouts()
        fetchCreatorCollections()
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
                loadouts(id, name, game_mode, view_count, vote_score, created_at, helmet, chest, legs, weapons, accessories, target_boss)
            `
            )
            .eq("collection_id", collection.id)
            .order("position", { ascending: true })

        if (!error && data) {
            setLoadouts(data as any)
        }
        setIsLoading(false)
    }

    const fetchAvailableLoadouts = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from("loadouts")
            .select("id, name")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (data) {
            setAvailableLoadouts(data)
        }
    }

    const fetchCreatorCollections = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from("collections")
            .select("id, name")
            .eq("user_id", user.id)
            .neq("id", collection.id)
            .order("created_at", { ascending: false })
            .limit(3)

        if (data) {
            setCreatorCollections(data)
        }
    }

    const handleAddLoadout = async () => {
        if (!selectedLoadout) return

        const supabase = createClient()
        const { error } = await supabase.from("collection_loadouts").insert({
            collection_id: collection.id,
            loadout_id: selectedLoadout,
            position: loadouts.length,
        })

        if (!error) {
            setSelectedLoadout("")
            setShowAddForm(false)
            fetchLoadouts()
            fetchAvailableLoadouts()
        } else {
            alert("Failed to add loadout")
        }
    }

    const handleRemove = async (id: string) => {
        const supabase = createClient()
        const { error } = await supabase
            .from("collection_loadouts")
            .delete()
            .eq("id", id)

        if (!error) {
            fetchLoadouts()
            fetchAvailableLoadouts()
        }
    }

    const handleDeleteCollection = async () => {
        if (!confirm(`Delete collection "${collection.name}"?`)) return

        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", collection.id)

        if (!error) {
            router.push("/my-collections")
        } else {
            alert("Failed to delete collection")
        }
    }

    const handleTogglePublic = async () => {
        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .update({ is_public: !collection.is_public })
            .eq("id", collection.id)

        if (!error) {
            router.refresh()
        }
    }

    const handleCopyShareUrl = () => {
        const shareUrl = `${window.location.origin}/collections/${collection.id}`
        navigator.clipboard.writeText(shareUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    const handleCloneCollection = async () => {
        const newName = prompt(
            "Enter name for cloned collection:",
            `${collection.name} (Copy)`
        )
        if (!newName?.trim()) return

        const supabase = createClient()

        // Create new collection
        const { data: newCollection, error: collectionError } = await supabase
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

        if (collectionError || !newCollection) {
            alert("Failed to clone collection")
            return
        }

        // Copy all loadouts
        const loadoutInserts = loadouts.map((item, index) => ({
            collection_id: newCollection.id,
            loadout_id: item.loadout_id,
            position: index,
        }))

        const { error: loadoutsError } = await supabase
            .from("collection_loadouts")
            .insert(loadoutInserts)

        if (loadoutsError) {
            alert("Failed to copy loadouts to cloned collection")
        } else {
            router.push(`/my-collections/${newCollection.id}`)
        }
    }

    const handleSaveVideoUrl = async () => {
        let finalUrl = videoUrl.trim()

        // Normalize YouTube URLs to accept all formats
        if (finalUrl) {
            // Match various YouTube URL formats
            const youtubeRegex =
                /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
            const match = finalUrl.match(youtubeRegex)

            if (match && match[1]) {
                // Convert to standard watch URL for consistency
                finalUrl = `https://www.youtube.com/watch?v=${match[1]}`
            }
        }

        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .update({ video_url: finalUrl || null })
            .eq("id", collection.id)
            .eq("user_id", user.id)

        if (!error) {
            collection.video_url = finalUrl || null
            setVideoUrl(finalUrl)
            setEditingVideoUrl(false)
            router.refresh()
        } else {
            console.error("Error updating video URL:", error)
            alert(`Failed to update video URL: ${error.message}`)
        }
    }

    const handleSaveName = async () => {
        if (!name.trim()) {
            alert("Collection name cannot be empty")
            return
        }

        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .update({ name: name.trim() })
            .eq("id", collection.id)
            .eq("user_id", user.id)

        if (!error) {
            collection.name = name.trim()
            setEditingName(false)
            router.refresh()
        } else {
            console.error("Error updating name:", error)
            alert(`Failed to update collection name: ${error.message}`)
        }
    }

    const handleSaveDescription = async () => {
        const supabase = createClient()
        const { error } = await supabase
            .from("collections")
            .update({ description: description.trim() || null })
            .eq("id", collection.id)
            .eq("user_id", user.id)

        if (!error) {
            collection.description = description.trim() || null
            setEditingDescription(false)
            router.refresh()
        } else {
            console.error("Error updating description:", error)
            alert(`Failed to update description: ${error.message}`)
        }
    }

    // Helper to detect mods used in a loadout
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

    // Boss order for sorting
    const bossOrder = [
        "King Slime",
        "Eye of Cthulhu",
        "Eater of Worlds",
        "Brain of Cthulhu",
        "Queen Bee",
        "Skeletron",
        "Deerclops",
        "Wall of Flesh",
        "Queen Slime",
        "The Twins",
        "The Destroyer",
        "Skeletron Prime",
        "Plantera",
        "Golem",
        "Duke Fishron",
        "Empress of Light",
        "Lunatic Cultist",
        "Moon Lord",
        // Calamity bosses
        "Desert Scourge",
        "Crabulon",
        "The Hive Mind",
        "The Perforators",
        "The Slime God",
        "Cryogen",
        "Aquatic Scourge",
        "Brimstone Elemental",
        "Calamitas Clone",
        "Leviathan and Anahita",
        "Astrum Aureus",
        "The Plaguebringer Goliath",
        "Ravager",
        "Astrum Deus",
        "Profaned Guardians",
        "Providence",
        "Storm Weaver",
        "Ceaseless Void",
        "Signus",
        "Polterghast",
        "Old Duke",
        "The Devourer of Gods",
        "Yharon",
        "Supreme Calamitas",
        "Exo Mechs",
    ]

    const getBossOrder = (boss: string | null | undefined) => {
        if (!boss) return 999
        const index = bossOrder.findIndex(
            (b) =>
                boss.toLowerCase().includes(b.toLowerCase()) ||
                b.toLowerCase().includes(boss.toLowerCase())
        )
        return index === -1 ? 999 : index
    }

    // Sort loadouts based on selected criteria
    const sortedLoadouts = useMemo(() => {
        const items = [...loadouts]

        if (sortBy === "name") {
            items.sort((a, b) => a.loadouts.name.localeCompare(b.loadouts.name))
        } else if (sortBy === "boss") {
            items.sort((a, b) => {
                const orderA = getBossOrder(a.loadouts.target_boss)
                const orderB = getBossOrder(b.loadouts.target_boss)
                return orderA - orderB
            })
        }
        // "custom" uses the position order from database

        return items
    }, [loadouts, sortBy])

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        setDraggedItem(itemId)
        e.dataTransfer.effectAllowed = "move"
        // Add ghost image styling
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.cursor = "grabbing"
        }
    }

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedItem(null)
        setDragOverItem(null)
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.cursor = "grab"
        }
    }

    const handleDragOver = (e: React.DragEvent, itemId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (draggedItem && draggedItem !== itemId) {
            setDragOverItem(itemId)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if we're leaving the card entirely
        if (e.currentTarget === e.target) {
            setDragOverItem(null)
        }
    }

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault()

        if (!draggedItem || draggedItem === targetId || sortBy !== "custom")
            return

        const draggedIndex = loadouts.findIndex((l) => l.id === draggedItem)
        const targetIndex = loadouts.findIndex((l) => l.id === targetId)

        if (draggedIndex === -1 || targetIndex === -1) return

        // Reorder locally
        const newLoadouts = [...loadouts]
        const [removed] = newLoadouts.splice(draggedIndex, 1)
        newLoadouts.splice(targetIndex, 0, removed)

        // Update positions
        const updates = newLoadouts.map((item, index) => ({
            id: item.id,
            position: index,
        }))

        setLoadouts(newLoadouts)
        setDraggedItem(null)
        setDragOverItem(null)

        // Update in database
        const supabase = createClient()
        for (const update of updates) {
            await supabase
                .from("collection_loadouts")
                .update({ position: update.position })
                .eq("id", update.id)
        }
    }

    const alreadyInCollection = new Set(loadouts.map((l) => l.loadout_id))
    const filteredAvailable = availableLoadouts.filter(
        (l) => !alreadyInCollection.has(l.id)
    )

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-[1400px] mx-auto w-full p-4'>
                {/* Header */}
                <div className='mb-6'>
                    <div className='flex flex-col lg:flex-row justify-between items-start gap-4'>
                        <div className='flex flex-col gap-4 flex-1 min-w-0'>
                            {/* Title Section - Editable */}
                            {editingName ? (
                                <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
                                    <input
                                        type='text'
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        className='flex-1 min-w-0 px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-2xl font-bold focus:outline-none focus:border-cyan-500'
                                        placeholder='Collection name'
                                    />
                                    <div className='flex gap-2 shrink-0'>
                                        <button
                                            onClick={handleSaveName}
                                            className='px-4 py-2 bg-green-600 hover:bg-green-500 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all'>
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setName(collection.name)
                                                setEditingName(false)
                                            }}
                                            className='px-4 py-2 bg-gray-600 hover:bg-gray-500 border-2 border-gray-400 rounded-lg font-semibold text-foreground transition-all'>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex items-center gap-2 flex-wrap min-w-0'>
                                    <h1
                                        className='text-2xl sm:text-3xl font-bold text-foreground uppercase break-words min-w-0 flex-1'
                                        style={{
                                            wordBreak: "break-word",
                                            overflowWrap: "anywhere",
                                        }}>
                                        {collection.name}
                                    </h1>
                                    <button
                                        onClick={() => setEditingName(true)}
                                        className='px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-gray-400 dark:border-gray-600 rounded text-foreground font-semibold transition-all shrink-0'>
                                        ✏️ Edit
                                    </button>
                                    {collection.is_public && (
                                        <span className='hidden lg:inline-block px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-500 dark:border-green-700 rounded text-sm font-medium'>
                                            Public
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Description Section - Editable */}
                            {editingDescription ? (
                                <div className='flex flex-col gap-2'>
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        rows={3}
                                        className='px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500 resize-none'
                                        placeholder='Collection description (optional)'
                                    />
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={handleSaveDescription}
                                            className='px-4 py-2 bg-green-600 hover:bg-green-500 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all text-sm'>
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDescription(
                                                    collection.description || ""
                                                )
                                                setEditingDescription(false)
                                            }}
                                            className='px-4 py-2 bg-gray-600 hover:bg-gray-500 border-2 border-gray-400 rounded-lg font-semibold text-foreground transition-all text-sm'>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex items-start gap-2'>
                                    <p className='text-gray-400 break-words min-w-0 flex-1'>
                                        {collection.description ||
                                            "No description"}
                                    </p>
                                    <button
                                        onClick={() =>
                                            setEditingDescription(true)
                                        }
                                        className='px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-gray-400 dark:border-gray-600 rounded text-foreground font-semibold transition-all shrink-0'>
                                        ✏️ Edit
                                    </button>
                                </div>
                            )}

                            {/* Public Badge - Mobile only */}
                            {collection.is_public && (
                                <div className='lg:hidden'>
                                    <span className='px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-500 dark:border-green-700 rounded text-xs font-medium'>
                                        Public
                                    </span>
                                </div>
                            )}

                            {/* Metadata - small text */}
                            <div className='flex flex-wrap gap-3 text-xs text-gray-500'>
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

                        {/* Action buttons */}
                        <div className='flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end'>
                            {copySuccess && (
                                <div className='px-3 py-2 bg-green-600 border-2 border-green-400 rounded text-sm font-semibold text-foreground'>
                                    ✓ Copied!
                                </div>
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
                                className='px-4 py-2 bg-purple-600/50 hover:bg-purple-500/50 border-2 border-purple-500 dark:border-purple-600 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap flex items-center gap-2'>
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
                                Clone
                            </button>
                            <button
                                onClick={() =>
                                    setEditingVideoUrl(!editingVideoUrl)
                                }
                                className='px-4 py-2 bg-yellow-600/50 hover:bg-yellow-500/50 border-2 border-yellow-500 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                                🎥 Video
                            </button>
                            <button
                                onClick={handleTogglePublic}
                                className='px-4 py-2 bg-blue-600/50 hover:bg-blue-500/50 border-2 border-blue-500 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                                {collection.is_public
                                    ? "Make Private"
                                    : "Make Public"}
                            </button>
                            <button
                                onClick={handleDeleteCollection}
                                className='px-4 py-2 bg-red-600/50 hover:bg-red-500/50 border-2 border-red-500 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                                Delete
                            </button>
                            <Link
                                href='/my-collections'
                                className='px-4 py-2 bg-gray-600/50 hover:bg-gray-500/50 border-2 border-gray-500 rounded text-sm font-semibold text-foreground transition-all whitespace-nowrap'>
                                Back to My Collections
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Video URL Editor */}
                {editingVideoUrl && (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 mb-6'>
                        <h3 className='text-lg font-bold text-yellow-400 mb-3'>
                            Edit Video URL
                        </h3>
                        <div className='flex gap-3'>
                            <input
                                type='url'
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder='https://youtube.com/watch?v=...'
                                className='flex-1 px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500'
                            />
                            <button
                                onClick={handleSaveVideoUrl}
                                className='px-6 py-2 bg-green-600 hover:bg-green-500 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all'>
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setEditingVideoUrl(false)
                                    setVideoUrl(collection.video_url || "")
                                }}
                                className='px-6 py-2 bg-gray-600 hover:bg-gray-500 border-2 border-gray-400 rounded-lg font-semibold text-foreground transition-all'>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Sort and Add controls */}
                <div className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6'>
                    <div className='flex items-center gap-2'>
                        <label className='text-sm text-gray-400 font-medium whitespace-nowrap'>
                            Sort by:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className='flex-1 sm:flex-initial px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                            <option value='custom'>Custom Order</option>
                            <option value='name'>Name (A-Z)</option>
                            <option value='boss'>Boss Progression</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className='px-4 py-2 bg-green-600/50 hover:bg-green-500/50 border-2 border-green-500 rounded-lg font-semibold text-foreground text-sm transition-all whitespace-nowrap'>
                        {showAddForm ? "Cancel" : "+ Add Loadout"}
                    </button>
                </div>

                {/* Add Loadout Form */}
                {showAddForm && filteredAvailable.length > 0 && (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4 mb-6'>
                        <div className='flex gap-3'>
                            <select
                                value={selectedLoadout}
                                onChange={(e) =>
                                    setSelectedLoadout(e.target.value)
                                }
                                className='flex-1 px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500'>
                                <option value=''>Select a loadout...</option>
                                {filteredAvailable.map((loadout) => (
                                    <option key={loadout.id} value={loadout.id}>
                                        {loadout.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddLoadout}
                                disabled={!selectedLoadout}
                                className='px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 border-2 border-cyan-400 disabled:border-gray-500 rounded-lg font-semibold text-foreground transition-all disabled:cursor-not-allowed'>
                                Add
                            </button>
                        </div>
                    </div>
                )}

                {/* Loadouts List */}
                {isLoading ? (
                    <div className='text-center text-gray-400 py-12'>
                        Loading...
                    </div>
                ) : loadouts.length === 0 ? (
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-12 text-center'>
                        <p className='text-gray-400 mb-4'>
                            This collection is empty
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className='px-6 py-2 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-2 border-green-400 rounded-lg font-semibold text-foreground transition-all'>
                            Add Loadouts
                        </button>
                    </div>
                ) : (
                    <div>
                        {sortBy === "custom" && (
                            <div className='mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300'>
                                💡 <strong>Tip:</strong> Drag and drop cards to
                                reorder them (only works in Custom Order mode)
                            </div>
                        )}
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {sortedLoadouts.map((item) => {
                                const mods = getModsUsed(item.loadouts)
                                const isDragging = draggedItem === item.id
                                const isDropTarget = dragOverItem === item.id

                                return (
                                    <div
                                        key={item.id}
                                        draggable={sortBy === "custom"}
                                        onDragStart={(e) =>
                                            handleDragStart(e, item.id)
                                        }
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) =>
                                            handleDragOver(e, item.id)
                                        }
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, item.id)}
                                        className='relative group'>
                                        <Link
                                            href={`/my-loadouts/${item.loadout_id}`}
                                            onClick={(e) => {
                                                // Prevent navigation while dragging
                                                if (isDragging) {
                                                    e.preventDefault()
                                                }
                                            }}
                                            className={`block bg-gradient-to-b card-dark border-2 rounded-lg p-4 transition-all ${
                                                isDragging
                                                    ? "opacity-40 scale-95 border-gray-500 cursor-grabbing"
                                                    : isDropTarget
                                                    ? "border-cyan-500 scale-102 shadow-lg shadow-cyan-500/50"
                                                    : "border-dark hover:border-cyan-500"
                                            } ${
                                                sortBy === "custom" &&
                                                !isDragging
                                                    ? "cursor-grab active:cursor-grabbing"
                                                    : ""
                                            }`}>
                                            {isDropTarget && (
                                                <div className='absolute inset-0 bg-cyan-500/10 rounded-lg pointer-events-none' />
                                            )}
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
                                                    {item.loadouts
                                                        .vote_score !== 0 && (
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
                                                <div className='flex flex-wrap gap-1 mb-3'>
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
                                                <div className='text-xs text-gray-600 dark:text-gray-500 mb-2'>
                                                    🎯{" "}
                                                    {item.loadouts.target_boss}
                                                </div>
                                            )}
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleRemove(item.id)
                                            }}
                                            className='absolute top-4 right-4 px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-400 rounded text-foreground font-medium transition-all text-sm opacity-0 group-hover:opacity-100 z-10 shadow-lg'>
                                            Remove
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Video Embed */}
                        {collection.video_url && (
                            <div className='mt-6 max-w-3xl mx-auto'>
                                <YouTubeEmbed
                                    url={collection.video_url}
                                    title={`${collection.name} - Video Guide`}
                                />
                            </div>
                        )}

                        {/* More from Creator */}
                        {creatorCollections.length > 0 && (
                            <div className='mt-6 bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                                <h3 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                    More from{" "}
                                    {user.user_metadata?.username || "you"}
                                </h3>
                                <div className='space-y-2'>
                                    {creatorCollections.map((other) => (
                                        <Link
                                            key={other.id}
                                            href={`/my-collections/${other.id}`}
                                            className='block p-2 bg-background dark:bg-[#0a0e1f] border border-border dark:border-[#1a2a4a] rounded hover:border-cyan-500 transition-colors'>
                                            <div className='text-sm text-foreground font-medium truncate'>
                                                {other.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
