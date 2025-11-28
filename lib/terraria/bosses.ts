/**
 * Boss data management and utilities
 *
 * Provides centralized access to boss information including progression order.
 * Boss data is loaded from JSON files containing scraped wiki data.
 *
 * @module lib/terraria/bosses
 */

import type { TerrariaBoss } from "./types"

// Import boss data from JSON files
import vanillaBosses from "@/data/bosses-vanilla.json"
import calamityBosses from "@/data/bosses-calamity.json"
import thoriumBosses from "@/data/bosses-thorium.json"

/**
 * Combined array of all bosses from all mods with order information
 * Sorted by order field to maintain progression sequence
 */
const allBosses: TerrariaBoss[] = [
    ...(vanillaBosses as TerrariaBoss[]),
    ...(calamityBosses as TerrariaBoss[]),
    ...(thoriumBosses as TerrariaBoss[]),
].sort((a, b) => {
    // Sort by mod first, then by order within mod
    if (a.mod !== b.mod) {
        const modOrder = { vanilla: 0, calamity: 1, thorium: 2 }
        return (
            (modOrder[a.mod as keyof typeof modOrder] || 99) -
            (modOrder[b.mod as keyof typeof modOrder] || 99)
        )
    }
    return (a.order || 999) - (b.order || 999)
})

/**
 * Map of boss names (lowercase) to their order for fast lookup
 * Used for sorting loadouts by boss progression
 */
const bossOrderMap = new Map<string, number>()
allBosses.forEach((boss, index) => {
    bossOrderMap.set(boss.name.toLowerCase(), index)
})

/**
 * Get the progression order of a boss by name
 *
 * @param bossName - Name of the boss (case-insensitive)
 * @returns Order number (0-based index), or 999 if boss not found
 *
 * @example
 * ```typescript
 * getBossOrder("Moon Lord") // Returns 17 (vanilla final boss)
 * getBossOrder("Supreme Calamitas") // Returns higher number (calamity final boss)
 * getBossOrder("Unknown Boss") // Returns 999
 * ```
 */
export function getBossOrder(bossName: string | null | undefined): number {
    if (!bossName) return 999

    const normalized = bossName.toLowerCase().trim()

    // Try exact match first
    if (bossOrderMap.has(normalized)) {
        return bossOrderMap.get(normalized)!
    }

    // Try partial matching (for variations like "Eater of Worlds" vs "The Eater of Worlds")
    for (const [name, order] of bossOrderMap.entries()) {
        if (name.includes(normalized) || normalized.includes(name)) {
            return order
        }
    }

    return 999 // Unknown boss - sort to end
}

/**
 * Get all bosses in progression order
 *
 * @returns Array of all bosses sorted by progression
 *
 * @example
 * ```typescript
 * const bosses = getAllBosses()
 * // Returns: [King Slime, Eye of Cthulhu, ..., Moon Lord, Desert Scourge, ...]
 * ```
 */
export function getAllBosses(): TerrariaBoss[] {
    return allBosses
}

/**
 * Get bosses filtered by mod
 *
 * @param mod - Mod identifier ("vanilla", "calamity", "thorium")
 * @returns Array of bosses from specified mod, sorted by order
 *
 * @example
 * ```typescript
 * const vanillaBosses = getBossesByMod("vanilla")
 * // Returns: [King Slime, Eye of Cthulhu, ..., Moon Lord]
 * ```
 */
export function getBossesByMod(mod: string): TerrariaBoss[] {
    return allBosses.filter((boss) => boss.mod === mod)
}

/**
 * Get bosses filtered by progression stage
 *
 * @param progression - Progression stage ("pre-hardmode", "hardmode", "post-moonlord")
 * @returns Array of bosses from specified progression stage, sorted by order
 *
 * @example
 * ```typescript
 * const prehardmodeBosses = getBossesByProgression("pre-hardmode")
 * // Returns: [King Slime, Eye of Cthulhu, ..., Wall of Flesh]
 * ```
 */
export function getBossesByProgression(progression: string): TerrariaBoss[] {
    return allBosses.filter((boss) => boss.progression === progression)
}

/**
 * Find a boss by name (case-insensitive)
 *
 * @param bossName - Name of the boss to find
 * @returns Boss object if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const moonLord = getBossByName("Moon Lord")
 * // Returns: { id: 18, name: "Moon Lord", order: 18, ... }
 * ```
 */
export function getBossByName(bossName: string): TerrariaBoss | undefined {
    const normalized = bossName.toLowerCase().trim()
    return allBosses.find((boss) => boss.name.toLowerCase() === normalized)
}
