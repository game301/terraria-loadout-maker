/**
 * Terraria Type Definitions
 * Core TypeScript interfaces and types for Terraria items, bosses, and loadouts.
 * @module lib/terraria/types
 */

/**
 * Categories of items available in Terraria.
 */
export type ItemType =
    | "weapon"
    | "armor"
    | "accessory"
    | "tool"
    | "consumable"
    | "other"

/**
 * Equipment slots for armor pieces.
 */
export type ArmorSlot = "head" | "chest" | "legs"

/**
 * Character classes/playstyles in Terraria.
 */
export type WeaponClass = "melee" | "ranged" | "magic" | "summoner"

/**
 * Game progression stages, typically tied to major bosses.
 */
export type BossProgression =
    | "pre-hardmode"
    | "hardmode"
    | "post-plantera"
    | "post-golem"

/**
 * Represents a Terraria item (weapon, armor, accessory, etc.).
 *
 * @property id - Unique identifier (mod-specific ranges: vanilla 1-99999, calamity 100000-199999, thorium 200000-299999)
 * @property name - Display name of the item
 * @property type - Category of item (weapon, armor, etc.)
 * @property rarity - Rarity tier (0-11+, affects color coding)
 * @property defense - Defense points (armor only)
 * @property damage - Base damage value (weapons only)
 * @property tooltip - Hover text description
 * @property imageUrl - URL to item sprite/icon
 * @property armorSlot - Equipment slot (armor only: "head", "chest", "legs")
 * @property weaponClass - Character class for weapons (melee, ranged, magic, summoner)
 */
export interface TerrariaItem {
    id: number
    name: string
    type: ItemType
    rarity: number
    defense?: number
    damage?: number
    tooltip?: string
    imageUrl?: string
    armorSlot?: ArmorSlot
    weaponClass?: WeaponClass
}

/**
 * Represents a Terraria boss enemy.
 *
 * @property id - Unique identifier (mod-specific ranges match item IDs)
 * @property name - Display name of the boss
 * @property mod - Mod the boss belongs to ("vanilla", "calamity", "thorium")
 * @property health - Maximum health points (optional - not available from wiki scraping)
 * @property defense - Defense stat reducing incoming damage (optional - not available from wiki scraping)
 * @property progression - Game stage when boss is typically fought
 * @property order - Sequential order in progression (1=first boss, etc.)
 * @property imageUrl - URL to boss sprite/icon
 */
export interface TerrariaBoss {
    id: number
    name: string
    mod: string
    health?: number
    defense?: number
    progression: BossProgression
    order: number
    imageUrl?: string
}

/**
 * Represents a complete character loadout for Terraria.
 * A loadout includes armor set, accessories, weapons, and metadata.
 *
 * @property id - Unique loadout identifier (UUID)
 * @property userId - Owner of the loadout (if saved)
 * @property name - User-defined name for the loadout
 * @property description - Optional detailed description or strategy notes
 * @property targetBoss - Boss this loadout is designed to fight
 * @property armor - Three-piece armor set (helmet, chestplate, leggings)
 * @property accessories - Up to 7 accessory items
 * @property weapons - Multiple weapon options for different situations
 * @property createdAt - Timestamp when loadout was created
 * @property updatedAt - Timestamp of last modification
 */
export interface Loadout {
    id: string
    userId?: string
    name: string
    description?: string
    targetBoss?: string
    armor: {
        head?: TerrariaItem
        chest?: TerrariaItem
        legs?: TerrariaItem
    }
    accessories: TerrariaItem[]
    weapons: TerrariaItem[]
    createdAt: Date
    updatedAt: Date
}
