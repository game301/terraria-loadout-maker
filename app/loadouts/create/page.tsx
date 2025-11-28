"use client"

import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    getItemImageUrl,
    getBossImageUrl,
    handleImageError,
} from "@/lib/terraria/images"
import vanillaItems from "@/data/items-vanilla.json"
import calamityItems from "@/data/items-calamity.json"
import thoriumItems from "@/data/items-thorium.json"
import vanillaBuffs from "@/data/buffs-vanilla.json"
import calamityBuffs from "@/data/buffs-calamity.json"
import thoriumBuffs from "@/data/buffs-thorium.json"
import vanillaAmmo from "@/data/ammunition-vanilla.json"
import calamityAmmo from "@/data/ammunition-calamity.json"
import thoriumAmmo from "@/data/ammunition-thorium.json"
import vanillaBosses from "@/data/bosses-vanilla.json"
import calamityBosses from "@/data/bosses-calamity.json"
import thoriumBosses from "@/data/bosses-thorium.json"

// Combine all mod data
const allItemsData = [...vanillaItems, ...calamityItems, ...thoriumItems]
const bossesData = [...vanillaBosses, ...calamityBosses, ...thoriumBosses]

type GameMode = "vanilla" | "modded"
type Difficulty = "classic" | "expert" | "master"
type VanillaProgression = "pre-hardmode" | "hardmode"
type ModdedProgression = "pre-hardmode" | "hardmode" | "post-moonlord"

type SlotType = "weapon" | "armor" | "accessory" | "buff" | "ammo"

interface SelectedItem {
    id: number
    name: string
    type: string
    mod?: string
    rarity?: number
    image?: string
}

const getRarityColor = (rarity: number) => {
    const rarityColors: { [key: number]: string } = {
        0: "text-foreground", // White
        1: "text-blue-400", // Blue
        2: "text-green-400", // Green
        3: "text-orange-400", // Orange
        4: "text-red-400", // Light Red
        5: "text-pink-400", // Pink
        6: "text-purple-400", // Purple
        7: "text-lime-400", // Lime
        8: "text-yellow-400", // Yellow
        9: "text-cyan-400", // Cyan
        10: "text-red-500", // Red
        11: "text-pink-500", // Pink variant
    }
    return rarityColors[rarity] || "text-gray-700 dark:text-gray-300"
}

export default function LoadoutBuilderPage() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [gameMode, setGameMode] = useState<GameMode>("vanilla")
    const [calamityEnabled, setCalamityEnabled] = useState(true)
    const [thoriumEnabled, setThoriumEnabled] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [vanillaDifficulty, setVanillaDifficulty] =
        useState<Difficulty>("expert")
    const [moddedDifficulty, setModdedDifficulty] =
        useState<Difficulty>("expert")
    const [vanillaProgression, setVanillaProgression] =
        useState<VanillaProgression>("hardmode")
    const [moddedProgression, setModdedProgression] =
        useState<ModdedProgression>("hardmode")

    // Slot state management
    const [weapons, setWeapons] = useState<(SelectedItem | null)[]>([
        null,
        null,
        null,
        null,
    ])
    const [armor, setArmor] = useState<(SelectedItem | null)[]>([
        null,
        null,
        null,
    ]) // head, chest, legs
    const [buffs, setBuffs] = useState<(SelectedItem | null)[]>([
        null,
        null,
        null,
    ])
    const [ammo, setAmmo] = useState<(SelectedItem | null)[]>([
        null,
        null,
        null,
    ])
    const [accessories, setAccessories] = useState<(SelectedItem | null)[]>([])

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [moddedItemsWarningOpen, setModdedItemsWarningOpen] = useState(false)
    const [pendingGameMode, setPendingGameMode] = useState<GameMode | null>(
        null
    )
    const [modalSlotType, setModalSlotType] = useState<SlotType>("weapon")
    const [modalSlotIndex, setModalSlotIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleItemCount, setVisibleItemCount] = useState(50)
    const [loadoutName, setLoadoutName] = useState("")
    const [isPublic, setIsPublic] = useState(true)
    const [videoLink, setVideoLink] = useState("")
    const [versionTag, setVersionTag] = useState("")
    const [selectedBosses, setSelectedBosses] = useState<string[]>([])

    // Check authentication on mount
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsAuthenticated(!!user)
        })
    }, [])

    // Calculate accessory slots based on game mode, difficulty and progression
    const getAccessorySlotCount = () => {
        let slots = 5 // Base slots

        if (gameMode === "vanilla") {
            // Vanilla mode
            if (vanillaDifficulty === "expert") slots += 1
            if (vanillaDifficulty === "master") slots += 1 // Master gets same bonus as Expert (total 6)
            if (vanillaProgression === "hardmode") slots += 1
        } else {
            // Modded mode - Expert by default
            if (moddedDifficulty === "expert") slots += 1
            if (moddedDifficulty === "master") slots += 1 // Master mode bonus
            if (moddedProgression === "hardmode") slots += 1
            if (moddedProgression === "post-moonlord") slots += 2 // +1 for hardmode, +1 for post-moonlord
        }

        return slots
    }

    const accessorySlotCount = getAccessorySlotCount()

    // Initialize accessories array when slot count changes
    if (accessories.length !== accessorySlotCount) {
        const newAccessories = Array(accessorySlotCount)
            .fill(null)
            .map((_, i) => accessories[i] || null)
        setAccessories(newAccessories)
    }

    // Check if any selected items are modded
    const hasModdedItems = () => {
        const allItems = [
            ...weapons.filter(Boolean),
            ...armor.filter(Boolean),
            ...accessories.filter(Boolean),
            ...buffs.filter(Boolean),
            ...ammo.filter(Boolean),
        ]
        return allItems.some(
            (item) => item?.mod === "calamity" || item?.mod === "thorium"
        )
    }

    // Remove all modded items
    const removeModdedItems = () => {
        setWeapons((prev) =>
            prev.map((item) =>
                item?.mod === "calamity" || item?.mod === "thorium"
                    ? null
                    : item
            )
        )
        setArmor((prev) =>
            prev.map((item) =>
                item?.mod === "calamity" || item?.mod === "thorium"
                    ? null
                    : item
            )
        )
        setAccessories((prev) =>
            prev.map((item) =>
                item?.mod === "calamity" || item?.mod === "thorium"
                    ? null
                    : item
            )
        )
        setBuffs((prev) =>
            prev.map((item) =>
                item?.mod === "calamity" || item?.mod === "thorium"
                    ? null
                    : item
            )
        )
        setAmmo((prev) =>
            prev.map((item) =>
                item?.mod === "calamity" || item?.mod === "thorium"
                    ? null
                    : item
            )
        )
    }

    // Handle game mode change with modded items check
    const handleGameModeChange = (newMode: GameMode) => {
        // If switching to vanilla and has modded items, show warning
        if (
            newMode === "vanilla" &&
            gameMode === "modded" &&
            hasModdedItems()
        ) {
            setPendingGameMode(newMode)
            setModdedItemsWarningOpen(true)
        } else {
            setGameMode(newMode)
        }
    }

    // Confirm game mode change and remove modded items
    const confirmGameModeChange = () => {
        if (pendingGameMode) {
            removeModdedItems()
            setGameMode(pendingGameMode)
            setPendingGameMode(null)
            setModdedItemsWarningOpen(false)
        }
    }

    // Cancel game mode change
    const cancelGameModeChange = () => {
        setPendingGameMode(null)
        setModdedItemsWarningOpen(false)
    }

    // Handle slot click to open modal
    const handleSlotClick = (type: SlotType, index: number) => {
        setModalSlotType(type)
        setModalSlotIndex(index)
        setSearchQuery("")
        setVisibleItemCount(50)
        setModalOpen(true)
    }

    // Handle clear all
    const handleClearAll = () => {
        if (
            confirm(
                "Are you sure you want to clear all items from this loadout?"
            )
        ) {
            setWeapons([null, null, null, null])
            setArmor([null, null, null])
            setAccessories(Array(accessorySlotCount).fill(null))
            setBuffs([null, null, null])
            setAmmo([null, null, null])
            setLoadoutName("New Loadout")
        }
    }

    // Toggle boss selection
    const toggleBoss = (bossName: string) => {
        setSelectedBosses((prev) => {
            if (prev.includes(bossName)) {
                // Prevent removing the last boss
                if (prev.length === 1) {
                    alert("You must select at least one boss")
                    return prev
                }
                return prev.filter((b) => b !== bossName)
            }
            return [...prev, bossName]
        })
    }

    // Handle save loadout
    const handleSaveLoadout = async () => {
        const supabase = createClient()

        // Check if user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            if (
                confirm(
                    "You need to sign in to save loadouts. Go to login page?"
                )
            ) {
                router.push("/auth/login")
            }
            return
        }

        if (!loadoutName.trim()) {
            alert("Please enter a loadout name")
            return
        }

        if (selectedBosses.length === 0) {
            alert("Please select at least one boss for this loadout")
            return
        }

        setIsSaving(true)

        try {
            // Prepare loadout data for database
            const loadoutData = {
                user_id: user.id,
                name: loadoutName,
                game_mode: gameMode,
                is_public: isPublic,
                version_tag: versionTag.trim() || null,
                video_link: videoLink.trim() || null,
                target_boss: selectedBosses.join(" | ") || null,
                creator_username:
                    user.user_metadata?.username ||
                    `@${user.id.substring(0, 8)}`,
                helmet: armor[0]
                    ? {
                          id: armor[0].id,
                          name: armor[0].name,
                          mod: armor[0].mod,
                          rarity: armor[0].rarity,
                      }
                    : null,
                chest: armor[1]
                    ? {
                          id: armor[1].id,
                          name: armor[1].name,
                          mod: armor[1].mod,
                          rarity: armor[1].rarity,
                      }
                    : null,
                legs: armor[2]
                    ? {
                          id: armor[2].id,
                          name: armor[2].name,
                          mod: armor[2].mod,
                          rarity: armor[2].rarity,
                      }
                    : null,
                accessories: accessories.filter(Boolean).map((item) => ({
                    id: item!.id,
                    name: item!.name,
                    mod: item!.mod,
                    rarity: item!.rarity,
                })),
                weapons: weapons.filter(Boolean).map((item) => ({
                    id: item!.id,
                    name: item!.name,
                    mod: item!.mod,
                    rarity: item!.rarity,
                })),
                buffs: buffs.filter(Boolean).map((item) => ({
                    id: item!.id,
                    name: item!.name,
                    mod: item!.mod,
                    rarity: item!.rarity,
                })),
            }

            const { data, error } = await supabase
                .from("loadouts")
                .insert(loadoutData)
                .select()
                .single()

            if (error) throw error

            alert(`Loadout "${loadoutName}" saved successfully!`)
            if (isPublic) {
                router.push("/loadouts")
            } else {
                router.push("/my-loadouts")
            }
        } catch (error) {
            console.error("Error saving loadout:", error)
            alert("Failed to save loadout. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    // Handle item selection from modal
    // Handle item selection from modal
    const handleItemSelect = (item: SelectedItem) => {
        switch (modalSlotType) {
            case "weapon":
                // Check if weapon already exists in another slot
                if (
                    weapons.some(
                        (w, i) => w && w.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert("This weapon is already equipped in another slot!")
                    return
                }
                const newWeapons = [...weapons]
                newWeapons[modalSlotIndex] = item
                setWeapons(newWeapons)
                break
            case "armor":
                // Check if armor already exists in another slot
                if (
                    armor.some(
                        (a, i) => a && a.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert(
                        "This armor piece is already equipped in another slot!"
                    )
                    return
                }
                const newArmor = [...armor]
                newArmor[modalSlotIndex] = item
                setArmor(newArmor)
                break
            case "accessory":
                // Check if accessory already exists in another slot
                if (
                    accessories.some(
                        (a, i) => a && a.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert("This accessory is already equipped in another slot!")
                    return
                }

                // Check for wings - only one allowed
                const isWings =
                    item.name.toLowerCase().includes("wings") ||
                    item.name.toLowerCase().includes("wing") ||
                    item.name === "Fledgling Wings" ||
                    item.name === "Celestial Starboard"

                if (isWings) {
                    const hasWingsInOtherSlot = accessories.some(
                        (a, i) =>
                            i !== modalSlotIndex &&
                            a &&
                            (a.name.toLowerCase().includes("wings") ||
                                a.name.toLowerCase().includes("wing") ||
                                a.name === "Fledgling Wings" ||
                                a.name === "Celestial Starboard")
                    )
                    if (hasWingsInOtherSlot) {
                        alert("You can only equip one pair of wings!")
                        return
                    }
                }

                // Check for boots - only one allowed
                const isBoots =
                    item.name.toLowerCase().includes("boots") ||
                    item.name === "Sailfish Boots" ||
                    item.name === "Amphibian Boots" ||
                    item.name === "Frostspark Boots" ||
                    item.name === "Terraspark Boots" ||
                    item.name === "Lightning Boots" ||
                    item.name === "Spectre Boots" ||
                    item.name === "Rocket Boots" ||
                    item.name === "Hermes Boots" ||
                    item.name === "Flurry Boots" ||
                    item.name === "Dunerider Boots"

                if (isBoots) {
                    const hasBootsInOtherSlot = accessories.some(
                        (a, i) =>
                            i !== modalSlotIndex &&
                            a &&
                            (a.name.toLowerCase().includes("boots") ||
                                a.name === "Sailfish Boots" ||
                                a.name === "Amphibian Boots" ||
                                a.name === "Frostspark Boots" ||
                                a.name === "Terraspark Boots" ||
                                a.name === "Lightning Boots" ||
                                a.name === "Spectre Boots" ||
                                a.name === "Rocket Boots" ||
                                a.name === "Hermes Boots" ||
                                a.name === "Flurry Boots" ||
                                a.name === "Dunerider Boots")
                    )
                    if (hasBootsInOtherSlot) {
                        alert("You can only equip one pair of boots!")
                        return
                    }
                }

                const newAccessories = [...accessories]
                newAccessories[modalSlotIndex] = item
                setAccessories(newAccessories)
                break
            case "buff":
                // Check if buff already exists in another slot
                if (
                    buffs.some(
                        (b, i) => b && b.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert("This buff is already active in another slot!")
                    return
                }
                const newBuffs = [...buffs]
                newBuffs[modalSlotIndex] = item
                setBuffs(newBuffs)
                break
            case "ammo":
                // Check if ammo already exists in another slot
                if (
                    ammo.some(
                        (a, i) => a && a.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert("This ammo is already equipped in another slot!")
                    return
                }
                const newAmmo = [...ammo]
                newAmmo[modalSlotIndex] = item
                setAmmo(newAmmo)
                break
        }
        setModalOpen(false)
    }

    // Combine items based on enabled mods
    const allItems = useMemo(() => {
        let items: any[] = []

        if (gameMode === "vanilla") {
            // Vanilla mode: only show vanilla items
            items = [
                ...allItemsData.filter((item: any) => item.mod === "vanilla"),
                ...vanillaBuffs,
                ...vanillaAmmo,
            ]
        } else {
            // Modded mode: show vanilla + enabled mods
            const vanillaItems = allItemsData.filter(
                (item: any) => item.mod === "vanilla"
            )
            items = [...vanillaItems, ...vanillaBuffs, ...vanillaAmmo]

            if (calamityEnabled) {
                const calamityItems = allItemsData.filter(
                    (item: any) => item.mod === "calamity"
                )
                items = [
                    ...items,
                    ...calamityItems,
                    ...calamityBuffs,
                    ...calamityAmmo,
                ]
            }
            if (thoriumEnabled) {
                const thoriumItems = allItemsData.filter(
                    (item: any) => item.mod === "thorium"
                )
                items = [
                    ...items,
                    ...thoriumItems,
                    ...thoriumBuffs,
                    ...thoriumAmmo,
                ]
            }
        }

        // Remove duplicates by keeping only the first occurrence of each unique name+mod combination
        const uniqueItems = items.reduce((acc: any[], item: any) => {
            if (
                !acc.some(
                    (existingItem: any) =>
                        existingItem.name === item.name &&
                        existingItem.mod === item.mod
                )
            ) {
                acc.push(item)
            }
            return acc
        }, [])

        // Sort items by name alphabetically
        return uniqueItems.sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
        )
    }, [gameMode, calamityEnabled, thoriumEnabled])

    // Filter items for modal
    const filteredItems = useMemo(() => {
        let items = allItems

        // Filter by slot type
        switch (modalSlotType) {
            case "weapon":
                items = items.filter((item: any) => item.type === "weapon")
                break
            case "armor":
                // Filter by armor slot based on index (0=helmet, 1=chestplate, 2=leggings)
                const armorSlots = ["helmet", "chestplate", "leggings"] as const
                const requiredArmorSlot = armorSlots[modalSlotIndex]
                items = items.filter(
                    (item: any) =>
                        item.type === "armor" &&
                        item.armorType === requiredArmorSlot
                )
                break
            case "accessory":
                items = items.filter((item: any) => item.type === "accessory")
                break
            case "buff":
                items = items.filter(
                    (item: any) =>
                        item.type === "consumable" ||
                        item.type === "potion" ||
                        item.type === "buff"
                )
                break
            case "ammo":
                items = items.filter((item: any) => item.type === "ammunition")
                break
        }

        // Filter by search query
        if (searchQuery) {
            items = items.filter((item: any) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return items
    }, [allItems, modalSlotType, modalSlotIndex, searchQuery])

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-7xl mx-auto w-full p-4'>
                {/* Login Required Message */}
                {isAuthenticated === false && (
                    <div className='mb-6 bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-600 dark:border-yellow-500 rounded-lg p-4'>
                        <div className='flex items-center gap-3'>
                            <svg
                                className='w-6 h-6 text-yellow-700 dark:text-yellow-400 flex-shrink-0'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path>
                            </svg>
                            <div className='flex-1'>
                                <h3 className='text-lg font-bold text-yellow-800 dark:text-yellow-400'>
                                    Sign In Required
                                </h3>
                                <p className='text-gray-800 dark:text-foreground mt-1'>
                                    You need to be signed in to save loadouts.{" "}
                                    <Link
                                        href='/auth/login'
                                        className='text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 underline font-semibold'>
                                        Sign in now
                                    </Link>{" "}
                                    to save your work.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-foreground text-center sm:text-left'>
                        CREATE LOADOUT
                    </h1>
                    <Link
                        href='/my-loadouts'
                        className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                        MY LOADOUTS
                    </Link>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4'>
                    {/* Left Panel - Character & Armor */}
                    <div className='space-y-4'>
                        {/* Armor Section */}
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
                                            <div
                                                onClick={() =>
                                                    handleSlotClick(
                                                        "armor",
                                                        index
                                                    )
                                                }
                                                className='w-16 h-16 bg-gradient-to-br slot-bg border-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center hover:border-yellow-500 transition-all cursor-pointer'>
                                                {armor[index] ? (
                                                    <img
                                                        src={getItemImageUrl(
                                                            armor[index]!.name,
                                                            armor[index]!.mod
                                                        )}
                                                        alt={armor[index]!.name}
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
                                                        +
                                                    </div>
                                                )}
                                            </div>
                                            <div className='flex-1'>
                                                <div
                                                    className={`text-sm font-medium ${
                                                        armor[index]
                                                            ? getRarityColor(
                                                                  armor[index]!
                                                                      .rarity ||
                                                                      0
                                                              )
                                                            : "text-gray-700 dark:text-gray-300"
                                                    }`}>
                                                    {armor[index]?.name ||
                                                        `Choose ${piece}`}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Buffs Section */}
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                Active Buffs
                            </h2>
                            <div className='grid grid-cols-3 gap-2'>
                                {buffs.map((buff, i) => (
                                    <div
                                        key={i}
                                        onClick={() =>
                                            handleSlotClick("buff", i)
                                        }
                                        className='w-12 h-12 bg-gradient-to-br slot-bg border-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:border-yellow-500 transition-all cursor-pointer'>
                                        {buff ? (
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
                                        ) : (
                                            <>
                                                <div className='text-xl text-gray-500'>
                                                    +
                                                </div>
                                                <div className='text-[8px] text-gray-500 mt-0.5'>
                                                    buff
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ammo Section */}
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider'>
                                Ammo
                            </h2>
                            <div className='grid grid-cols-3 gap-2'>
                                {ammo.map((ammoItem, i) => (
                                    <div
                                        key={i}
                                        onClick={() =>
                                            handleSlotClick("ammo", i)
                                        }
                                        className='w-12 h-12 bg-gradient-to-br slot-bg border-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:border-yellow-500 transition-all cursor-pointer'>
                                        {ammoItem ? (
                                            <img
                                                src={getItemImageUrl(
                                                    ammoItem.name,
                                                    ammoItem.mod
                                                )}
                                                alt={ammoItem.name}
                                                className='w-10 h-10 object-contain'
                                                onError={(e) =>
                                                    handleImageError(
                                                        e,
                                                        ammoItem.name,
                                                        ammoItem.mod,
                                                        40
                                                    )
                                                }
                                            />
                                        ) : (
                                            <>
                                                <div className='text-xl text-gray-500'>
                                                    +
                                                </div>
                                                <div className='text-[8px] text-gray-500 mt-0.5'>
                                                    ammo
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Panel - Weapons */}
                    <div className='space-y-4'>
                        {/* Main Weapons */}
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wider text-center'>
                                Weapons (Max 4)
                            </h2>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center'>
                                {weapons.map((weapon, i) => (
                                    <div
                                        key={i}
                                        className='flex flex-col items-center gap-2'>
                                        <div
                                            onClick={() =>
                                                handleSlotClick("weapon", i)
                                            }
                                            className='weapon-slot flex flex-col items-center justify-center cursor-pointer'>
                                            {weapon ? (
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
                                            ) : (
                                                <>
                                                    <div className='text-3xl sm:text-4xl text-gray-500'>
                                                        +
                                                    </div>
                                                    <div className='text-[10px] sm:text-xs text-gray-500 mt-1'>
                                                        choose weapon
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {weapon && (
                                            <div className='text-center'>
                                                <div
                                                    className={`text-xs sm:text-sm font-bold ${getRarityColor(
                                                        weapon.rarity || 0
                                                    )}`}>
                                                    {weapon.name}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loadout Info */}
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                        Loadout Name
                                    </label>
                                    <input
                                        type='text'
                                        value={loadoutName}
                                        onChange={(e) =>
                                            setLoadoutName(e.target.value)
                                        }
                                        placeholder='e.g.: Best Calamity Loadout Ever'
                                        className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors'
                                    />
                                </div>

                                {/* Game Mode Selection */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                        Game Mode
                                    </label>
                                    <select
                                        value={gameMode}
                                        onChange={(e) =>
                                            handleGameModeChange(
                                                e.target.value as GameMode
                                            )
                                        }
                                        className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                        <option value='vanilla'>Vanilla</option>
                                        <option value='modded'>Modded</option>
                                    </select>
                                </div>

                                {/* Modded - Mod Toggles */}
                                {gameMode === "modded" && (
                                    <div>
                                        <label className='block text-xs font-medium text-gray-400 mb-2 uppercase'>
                                            Mods
                                        </label>
                                        <div className='flex gap-3'>
                                            <div
                                                onClick={() =>
                                                    setCalamityEnabled(
                                                        !calamityEnabled
                                                    )
                                                }
                                                className={`relative w-16 h-16 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                                                    calamityEnabled
                                                        ? "ring-2 ring-cyan-500"
                                                        : "opacity-50 hover:opacity-75"
                                                }`}>
                                                <img
                                                    src='/terraria/mods/Calamity_Logo_1.webp'
                                                    alt='Calamity Mod'
                                                    className='w-full h-full object-contain'
                                                />
                                                {calamityEnabled && (
                                                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center'>
                                                        <svg
                                                            className='w-3 h-3 text-foreground'
                                                            fill='none'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth='3'
                                                            viewBox='0 0 24 24'
                                                            stroke='currentColor'>
                                                            <path d='M5 13l4 4L19 7'></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                onClick={() =>
                                                    setThoriumEnabled(
                                                        !thoriumEnabled
                                                    )
                                                }
                                                className={`relative w-16 h-16 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                                                    thoriumEnabled
                                                        ? "ring-2 ring-cyan-500"
                                                        : "opacity-50 hover:opacity-75"
                                                }`}>
                                                <img
                                                    src='/terraria/mods/Thorium_Logo_1.webp'
                                                    alt='Thorium Mod'
                                                    className='w-full h-full object-contain'
                                                />
                                                {thoriumEnabled && (
                                                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center'>
                                                        <svg
                                                            className='w-3 h-3 text-foreground'
                                                            fill='none'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth='3'
                                                            viewBox='0 0 24 24'
                                                            stroke='currentColor'>
                                                            <path d='M5 13l4 4L19 7'></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Boss Selection */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-2 uppercase'>
                                        Target Boss(es)
                                    </label>
                                    <div className='max-h-48 overflow-y-auto bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg p-3'>
                                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2'>
                                            {bossesData
                                                .filter((boss: any) => {
                                                    if (
                                                        gameMode === "vanilla"
                                                    ) {
                                                        return (
                                                            boss.mod ===
                                                            "vanilla"
                                                        )
                                                    }
                                                    // In modded mode, show all bosses
                                                    if (
                                                        !calamityEnabled &&
                                                        boss.mod === "calamity"
                                                    ) {
                                                        return false
                                                    }
                                                    if (
                                                        !thoriumEnabled &&
                                                        boss.mod === "thorium"
                                                    ) {
                                                        return false
                                                    }
                                                    return true
                                                })
                                                .map((boss: any) => (
                                                    <div
                                                        key={boss.name}
                                                        onClick={() =>
                                                            toggleBoss(
                                                                boss.name
                                                            )
                                                        }
                                                        className={`relative w-14 h-14 rounded cursor-pointer transition-all hover:scale-105 ${
                                                            selectedBosses.includes(
                                                                boss.name
                                                            )
                                                                ? "ring-2 ring-cyan-500"
                                                                : "opacity-60 hover:opacity-90"
                                                        }`}
                                                        title={boss.name}>
                                                        <img
                                                            src={getBossImageUrl(
                                                                boss.name,
                                                                boss.mod
                                                            )}
                                                            alt={boss.name}
                                                            className='w-full h-full object-contain'
                                                            onError={(e) => {
                                                                const target =
                                                                    e.currentTarget
                                                                if (
                                                                    !target
                                                                        .dataset
                                                                        .fallback
                                                                ) {
                                                                    target.dataset.fallback =
                                                                        "1"
                                                                    // Fallback to text
                                                                    const initial =
                                                                        boss.name
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()
                                                                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23374151' width='64' height='64' rx='4'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='%23fff' font-size='32' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`
                                                                }
                                                            }}
                                                        />
                                                        {selectedBosses.includes(
                                                            boss.name
                                                        ) && (
                                                            <div className='absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center'>
                                                                <svg
                                                                    className='w-2.5 h-2.5 text-foreground'
                                                                    fill='none'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    strokeWidth='3'
                                                                    viewBox='0 0 24 24'
                                                                    stroke='currentColor'>
                                                                    <path d='M5 13l4 4L19 7'></path>
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                        {selectedBosses.length > 0 && (
                                            <div className='mt-3 pt-3 border-t border-border dark:border-[#1a2a4a]'>
                                                <div className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
                                                    Selected:
                                                </div>
                                                <div className='flex flex-wrap gap-1'>
                                                    {selectedBosses.map(
                                                        (boss) => (
                                                            <span
                                                                key={boss}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    toggleBoss(
                                                                        boss
                                                                    )
                                                                }}
                                                                className='px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-500 dark:border-cyan-700 rounded text-xs cursor-pointer hover:bg-cyan-200 dark:hover:bg-cyan-900/70 transition-colors'>
                                                                {boss} ×
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Visibility Toggle */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                        Visibility
                                    </label>
                                    <select
                                        value={isPublic ? "public" : "private"}
                                        onChange={(e) =>
                                            setIsPublic(
                                                e.target.value === "public"
                                            )
                                        }
                                        className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                        <option value='public'>
                                            Public (visible to all)
                                        </option>
                                        <option value='private'>
                                            Private (only you)
                                        </option>
                                    </select>
                                </div>

                                {/* Version Tag */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                        Version (Optional)
                                    </label>
                                    <input
                                        type='text'
                                        value={versionTag}
                                        onChange={(e) =>
                                            setVersionTag(e.target.value)
                                        }
                                        placeholder='e.g.: 1.4.4, Calamity 2.0'
                                        className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-600'
                                    />
                                </div>

                                {/* Video Link */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                        Video Link (Optional)
                                    </label>
                                    <input
                                        type='text'
                                        value={videoLink}
                                        onChange={(e) =>
                                            setVideoLink(e.target.value)
                                        }
                                        placeholder='YouTube URL'
                                        className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-600'
                                    />
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    {/* Vanilla - Difficulty */}
                                    {gameMode === "vanilla" && (
                                        <div>
                                            <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                                Difficulty
                                            </label>
                                            <select
                                                value={vanillaDifficulty}
                                                onChange={(e) =>
                                                    setVanillaDifficulty(
                                                        e.target
                                                            .value as Difficulty
                                                    )
                                                }
                                                className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                                <option value='classic'>
                                                    Classic
                                                </option>
                                                <option value='expert'>
                                                    Expert (+1)
                                                </option>
                                                <option value='master'>
                                                    Master (+1)
                                                </option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Modded - Difficulty */}
                                    {gameMode === "modded" && (
                                        <div>
                                            <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                                Difficulty
                                            </label>
                                            <select
                                                value={moddedDifficulty}
                                                onChange={(e) =>
                                                    setModdedDifficulty(
                                                        e.target
                                                            .value as Difficulty
                                                    )
                                                }
                                                className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                                <option value='classic'>
                                                    Classic
                                                </option>
                                                <option value='expert'>
                                                    Expert (+1)
                                                </option>
                                                <option value='master'>
                                                    Master* (+1)
                                                </option>
                                            </select>
                                            {moddedDifficulty === "master" && (
                                                <p className='text-xs text-yellow-400 mt-1'>
                                                    * Does not work properly
                                                    with all mods
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Progression */}
                                    <div>
                                        <label className='block text-xs font-medium text-gray-400 mb-1 uppercase'>
                                            Progression
                                        </label>
                                        {gameMode === "vanilla" ? (
                                            <select
                                                value={vanillaProgression}
                                                onChange={(e) =>
                                                    setVanillaProgression(
                                                        e.target
                                                            .value as VanillaProgression
                                                    )
                                                }
                                                className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                                <option value='pre-hardmode'>
                                                    Pre-Hardmode
                                                </option>
                                                <option value='hardmode'>
                                                    Hardmode (+1)
                                                </option>
                                            </select>
                                        ) : (
                                            <select
                                                value={moddedProgression}
                                                onChange={(e) =>
                                                    setModdedProgression(
                                                        e.target
                                                            .value as ModdedProgression
                                                    )
                                                }
                                                className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'>
                                                <option value='pre-hardmode'>
                                                    Pre-Hardmode
                                                </option>
                                                <option value='hardmode'>
                                                    Hardmode (+1)
                                                </option>
                                                <option value='post-moonlord'>
                                                    Post-Moon Lord (+2)
                                                </option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Accessories */}
                    <div className='space-y-4'>
                        {/* Accessories */}
                        <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                            <h2 className='text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider text-center'>
                                Accessories ({accessorySlotCount})
                            </h2>
                            <div className='space-y-2'>
                                {accessories.map((accessory, i) => (
                                    <div
                                        key={i}
                                        className='flex items-center gap-2'>
                                        <div
                                            onClick={() =>
                                                handleSlotClick("accessory", i)
                                            }
                                            className='accessory-slot flex flex-col items-center justify-center shrink-0 cursor-pointer'>
                                            {accessory ? (
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
                                            ) : (
                                                <>
                                                    <div className='text-xl text-gray-500'>
                                                        +
                                                    </div>
                                                    <div className='text-[8px] text-gray-500 mt-0.5'>
                                                        accessory
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            {accessory ? (
                                                <div
                                                    className={`text-xs font-semibold truncate ${getRarityColor(
                                                        accessory.rarity || 0
                                                    )}`}>
                                                    {accessory.name}
                                                </div>
                                            ) : (
                                                <div className='text-xs text-gray-500'>
                                                    Choose accessory
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='space-y-2'>
                            <button
                                onClick={handleSaveLoadout}
                                disabled={isSaving}
                                className='w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:border-gray-500 border-2 border-green-400 rounded-lg font-bold text-foreground uppercase tracking-wide text-xs sm:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(34,197,94,0.5)] disabled:shadow-none transition-all disabled:cursor-not-allowed'>
                                {isSaving ? "Saving..." : "Save Loadout"}
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={isSaving}
                                className='w-full px-3 sm:px-4 py-2 bg-gradient-to-b from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 disabled:opacity-50 border-2 border-gray-400 hover:border-gray-500 dark:border-gray-600 dark:hover:border-gray-500 rounded-lg font-semibold text-foreground uppercase tracking-wide text-xs sm:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.4)] transition-all disabled:cursor-not-allowed'>
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modded Items Warning Modal */}
            {moddedItemsWarningOpen && (
                <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
                    <div
                        className='bg-gradient-to-b from-[#1a1f3a] to-[#0f1428] border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full'
                        onClick={(e) => e.stopPropagation()}>
                        <div className='flex items-start gap-3 mb-4'>
                            <svg
                                className='w-8 h-8 text-yellow-400 flex-shrink-0 mt-1'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path>
                            </svg>
                            <div>
                                <h2 className='text-xl font-bold text-yellow-400 mb-2'>
                                    Modded Items Selected
                                </h2>
                                <p className='text-foreground mb-4'>
                                    You have modded items (Calamity or Thorium)
                                    selected. These items cannot be used in
                                    Vanilla mode.
                                </p>
                                <p className='text-gray-700 dark:text-gray-300 text-sm'>
                                    Would you like to remove all modded items
                                    and switch to Vanilla mode?
                                </p>
                            </div>
                        </div>

                        <div className='flex gap-3 justify-end'>
                            <button
                                onClick={cancelGameModeChange}
                                className='px-4 py-2 bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 rounded text-foreground font-semibold transition-all'>
                                Cancel
                            </button>
                            <button
                                onClick={confirmGameModeChange}
                                className='px-4 py-2 bg-red-600 hover:bg-red-500 border-2 border-red-500 rounded text-foreground font-semibold transition-all'>
                                Remove Modded Items
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Selection Modal */}
            {modalOpen && (
                <div
                    className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'
                    onClick={() => setModalOpen(false)}>
                    <div
                        className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col'
                        onClick={(e) => e.stopPropagation()}>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold text-yellow-400 uppercase'>
                                Select {modalSlotType}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className='text-gray-400 hover:text-foreground text-2xl leading-none'>
                                ×
                            </button>
                        </div>

                        <div className='mb-4'>
                            <input
                                type='text'
                                placeholder='Search items...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500'
                            />
                        </div>

                        <div className='flex-1 overflow-y-auto space-y-2'>
                            {filteredItems.length === 0 ? (
                                <div className='text-center text-gray-400 py-8'>
                                    No items found
                                </div>
                            ) : (
                                <>
                                    {filteredItems
                                        .slice(0, visibleItemCount)
                                        .map((item: any, index: number) => (
                                            <div
                                                key={`${item.mod}-${item.id}-${index}`}
                                                onClick={() =>
                                                    handleItemSelect({
                                                        id: item.id,
                                                        name: item.name,
                                                        type: item.type,
                                                        mod: item.mod,
                                                        rarity: item.rarity,
                                                    })
                                                }
                                                className='p-3 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded hover:border-cyan-500 cursor-pointer transition-colors flex items-center gap-3'>
                                                <img
                                                    src={getItemImageUrl(
                                                        item.name,
                                                        item.mod
                                                    )}
                                                    alt={item.name}
                                                    className='w-10 h-10 object-contain flex-shrink-0'
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            item.name,
                                                            item.mod,
                                                            40
                                                        )
                                                    }
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <div
                                                        className={`text-sm font-semibold truncate ${getRarityColor(
                                                            item.rarity
                                                        )}`}>
                                                        {item.name}
                                                    </div>
                                                    <div className='text-xs text-gray-400 truncate'>
                                                        {item.mod}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {visibleItemCount <
                                        filteredItems.length && (
                                        <button
                                            onClick={() =>
                                                setVisibleItemCount(
                                                    (prev) => prev + 50
                                                )
                                            }
                                            className='w-full py-3 bg-[#1a2a4a] border-2 border-dark rounded hover:border-cyan-500 text-cyan-400 font-semibold transition-colors'>
                                            Load More (
                                            {filteredItems.length -
                                                visibleItemCount}{" "}
                                            remaining)
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
