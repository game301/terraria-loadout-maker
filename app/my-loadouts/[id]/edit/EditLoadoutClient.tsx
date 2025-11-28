"use client"

import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import {
    getItemImageUrl,
    getBossImageUrl,
    handleImageError,
} from "@/lib/terraria/images"

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

interface LoadoutData {
    id: string
    name: string
    game_mode: string
    helmet: any
    chest: any
    legs: any
    accessories: any
    weapons: any
    buffs: any
    is_public: boolean
    version_tag?: string | null
    video_link?: string | null
    target_boss?: string | null
}

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

export default function EditLoadoutClient({
    loadout,
}: {
    loadout: LoadoutData
}) {
    const router = useRouter()
    const [gameMode, setGameMode] = useState<GameMode>(
        (loadout.game_mode as GameMode) || "vanilla"
    )
    const [calamityEnabled, setCalamityEnabled] = useState(false)
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

    // Initialize slots from loadout data
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
    ])
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
    const [modalSlotType, setModalSlotType] = useState<SlotType>("weapon")
    const [modalSlotIndex, setModalSlotIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleItemCount, setVisibleItemCount] = useState(50)
    const [loadoutName, setLoadoutName] = useState(loadout.name || "")
    const [isPublic, setIsPublic] = useState(loadout.is_public !== false)
    const [videoLink, setVideoLink] = useState(loadout.video_link || "")
    const [versionTag, setVersionTag] = useState(loadout.version_tag || "")
    const [selectedBosses, setSelectedBosses] = useState<string[]>([])

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

    // Load existing loadout data on mount
    useEffect(() => {
        // Detect enabled mods from items
        const allLoadoutItems = [
            ...(Array.isArray(loadout.weapons) ? loadout.weapons : []),
            ...(Array.isArray(loadout.accessories) ? loadout.accessories : []),
            ...(Array.isArray(loadout.buffs) ? loadout.buffs : []),
            loadout.helmet,
            loadout.chest,
            loadout.legs,
        ].filter(Boolean)

        const hasCalamity = allLoadoutItems.some(
            (item: any) => item?.mod === "calamity"
        )
        const hasThorium = allLoadoutItems.some(
            (item: any) => item?.mod === "thorium"
        )

        setCalamityEnabled(hasCalamity)
        setThoriumEnabled(hasThorium)

        // Load armor
        const armorData: (SelectedItem | null)[] = [
            loadout.helmet || null,
            loadout.chest || null,
            loadout.legs || null,
        ]
        setArmor(armorData)

        // Load weapons
        const weaponsData = Array.isArray(loadout.weapons)
            ? loadout.weapons
            : []
        const weaponsArray: (SelectedItem | null)[] = [
            weaponsData[0] || null,
            weaponsData[1] || null,
            weaponsData[2] || null,
            weaponsData[3] || null,
        ]
        setWeapons(weaponsArray)

        // Load buffs
        const buffsData = Array.isArray(loadout.buffs) ? loadout.buffs : []
        const buffsArray: (SelectedItem | null)[] = [
            buffsData[0] || null,
            buffsData[1] || null,
            buffsData[2] || null,
        ]
        setBuffs(buffsArray)

        // Load accessories
        const accessoriesData = Array.isArray(loadout.accessories)
            ? loadout.accessories
            : []
        setAccessories(accessoriesData)

        // Load bosses with validation
        if (loadout.target_boss) {
            const bossList = loadout.target_boss.split(" | ").filter(Boolean)
            // Ensure at least one boss is selected
            if (bossList.length > 0) {
                setSelectedBosses(bossList)
            } else {
                // Default to first available boss if none selected
                const firstBoss = bossesData[0]?.name
                if (firstBoss) {
                    setSelectedBosses([firstBoss])
                }
            }
        } else {
            // Default to first available boss if no target_boss field
            const firstBoss = bossesData[0]?.name
            if (firstBoss) {
                setSelectedBosses([firstBoss])
            }
        }
    }, [loadout])

    const getAccessorySlotCount = () => {
        let slots = 5
        if (gameMode === "vanilla") {
            if (vanillaDifficulty === "expert") slots += 1
            if (vanillaDifficulty === "master") slots += 1
            if (vanillaProgression === "hardmode") slots += 1
        } else {
            if (moddedDifficulty === "expert") slots += 1
            if (moddedDifficulty === "master") slots += 1
            if (moddedProgression === "hardmode") slots += 1
            if (moddedProgression === "post-moonlord") slots += 2
        }
        return slots
    }

    const accessorySlotCount = getAccessorySlotCount()

    if (accessories.length !== accessorySlotCount) {
        const newAccessories = Array(accessorySlotCount)
            .fill(null)
            .map((_, i) => accessories[i] || null)
        setAccessories(newAccessories)
    }

    const handleSlotClick = (type: SlotType, index: number) => {
        setModalSlotType(type)
        setModalSlotIndex(index)
        setSearchQuery("")
        setVisibleItemCount(50)
        setModalOpen(true)
    }

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
        }
    }

    const handleUpdateLoadout = async () => {
        const supabase = createClient()

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
            const loadoutData = {
                name: loadoutName,
                game_mode: gameMode,
                is_public: isPublic,
                version_tag: versionTag.trim() || null,
                video_link: videoLink.trim() || null,
                target_boss: selectedBosses.join(" | ") || null,
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

            const { error } = await supabase
                .from("loadouts")
                .update(loadoutData)
                .eq("id", loadout.id)

            if (error) throw error

            alert(`Loadout "${loadoutName}" updated successfully!`)
            router.push(`/my-loadouts/${loadout.id}`)
        } catch (error) {
            console.error("Error updating loadout:", error)
            alert("Failed to update loadout. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleItemSelect = (item: SelectedItem) => {
        switch (modalSlotType) {
            case "weapon":
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
                if (
                    accessories.some(
                        (a, i) => a && a.id === item.id && i !== modalSlotIndex
                    )
                ) {
                    alert("This accessory is already equipped in another slot!")
                    return
                }
                const newAccessories = [...accessories]
                newAccessories[modalSlotIndex] = item
                setAccessories(newAccessories)
                break
            case "buff":
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

    const allItems = useMemo(() => {
        let items: any[] = []

        if (gameMode === "vanilla") {
            items = [
                ...allItemsData.filter((item: any) => item.mod === "vanilla"),
                ...vanillaBuffs,
                ...vanillaAmmo,
            ]
        } else {
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

        return uniqueItems.sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
        )
    }, [gameMode, calamityEnabled, thoriumEnabled])

    const filteredItems = useMemo(() => {
        let items = allItems

        switch (modalSlotType) {
            case "weapon":
                items = items.filter((item: any) => item.type === "weapon")
                break
            case "armor":
                const armorSlotMap = ["helmet", "chestplate", "leggings"]
                const requiredArmorSlot = armorSlotMap[modalSlotIndex]
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

        if (searchQuery) {
            items = items.filter((item: any) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return items
    }, [allItems, modalSlotType, modalSlotIndex, searchQuery])

    return (
        <div className='min-h-screen terraria-bg'>
            <div className='max-w-[1400px] mx-auto w-full'>
                {/* Header */}
                <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-foreground text-center sm:text-left uppercase'>
                        Edit Loadout
                    </h1>
                    <Link
                        href={`/my-loadouts/${loadout.id}`}
                        className='px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 border-2 border-blue-500 dark:border-blue-700 rounded text-sm font-semibold text-white dark:text-foreground transition-all whitespace-nowrap'>
                        Cancel
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
                                            setGameMode(
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
                                    <div className='max-h-48 overflow-y-auto border-2 border-border dark:border-[#1a2a4a] rounded-lg p-3'>
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
                                                    } else {
                                                        // Show vanilla + enabled mods
                                                        if (
                                                            boss.mod ===
                                                            "vanilla"
                                                        )
                                                            return true
                                                        if (
                                                            boss.mod ===
                                                                "calamity" &&
                                                            calamityEnabled
                                                        )
                                                            return true
                                                        if (
                                                            boss.mod ===
                                                                "thorium" &&
                                                            thoriumEnabled
                                                        )
                                                            return true
                                                        return false
                                                    }
                                                })
                                                .map((boss: any) => (
                                                    <div
                                                        key={boss.id}
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
                                                                : "opacity-50 hover:opacity-75"
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
                                                                    e.target as HTMLImageElement
                                                                const initial =
                                                                    boss.name[0].toUpperCase()
                                                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='32' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`
                                                            }}
                                                        />
                                                        {selectedBosses.includes(
                                                            boss.name
                                                        ) && (
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
                                                ))}
                                        </div>
                                    </div>
                                    {selectedBosses.length > 0 && (
                                        <div className='mt-2 flex flex-wrap gap-1.5'>
                                            {selectedBosses.map((bossName) => (
                                                <span
                                                    key={bossName}
                                                    className='inline-flex items-center gap-1 px-2 py-1 bg-cyan-900/30 border border-cyan-600 text-cyan-300 rounded text-xs'>
                                                    {bossName}
                                                    <button
                                                        onClick={() =>
                                                            toggleBoss(bossName)
                                                        }
                                                        className='hover:text-red-400 transition-colors'>
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                                        placeholder='e.g., 1.4.4, Calamity 2.0'
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
                                onClick={handleUpdateLoadout}
                                disabled={isSaving}
                                className='w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:border-gray-500 border-2 border-green-400 rounded-lg font-bold text-foreground uppercase tracking-wide text-xs sm:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(34,197,94,0.5)] disabled:shadow-none transition-all disabled:cursor-not-allowed'>
                                {isSaving ? "Saving..." : "Update Loadout"}
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
