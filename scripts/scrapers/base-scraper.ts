/**
 * Base Wiki Scraper
 *
 * Provides common functionality and utilities for scraping Terraria wikis using Cheerio.
 * All mod-specific scrapers extend this base class to inherit shared parsing logic.
 *
 * Features:
 * - HTML fetching with error handling
 * - Cheerio HTML parsing
 * - Rarity and damage parsing utilities
 * - Rate limiting support
 * - User-Agent identification
 *
 * @module scrapers/base-scraper
 * @see {@link VanillaScraper}
 * @see {@link CalamityScraper}
 * @see {@link ThoriumScraper}
 */

import * as cheerio from "cheerio"

/**
 * Configuration for mod-specific wiki scrapers
 */
export interface ScraperConfig {
    /** Base URL of the wiki (e.g., "https://terraria.wiki.gg") */
    wikiBaseUrl: string
    /** Mod identifier for ID range assignment */
    modName: "vanilla" | "calamity" | "thorium"
    /** Starting ID for this mod (Vanilla: 1, Calamity: 100000, Thorium: 200000) */
    idRangeStart: number
}

/**
 * Scraped item data structure before final processing
 * Represents any item type (weapon, armor, accessory, etc.)
 */
export interface ScrapedItem {
    /** Display name of the item */
    name: string
    /** Item category */
    type:
        | "weapon"
        | "armor"
        | "accessory"
        | "tool"
        | "consumable"
        | "potion"
        | "buff"
        | "ammunition"
    /** Rarity tier (0-11, higher is rarer) */
    rarity: number
    /** Damage value (weapons only) */
    damage?: number
    /** Defense value (armor only) */
    defense?: number
    /** Armor slot specification */
    armorType?: "helmet" | "chestplate" | "leggings"
    /** Weapon damage class */
    weaponClass?:
        | "melee"
        | "ranged"
        | "magic"
        | "summoner"
        | "rogue"
        | "healer"
        | "bard"
        | "thrower"
    /** Associated buff name */
    buff?: string
}

/**
 * Scraped boss data structure before final processing
 */
export interface ScrapedBoss {
    /** Display name of the boss */
    name: string
    /** Game progression stage when boss is typically fought */
    progression: "pre-hardmode" | "hardmode" | "post-moonlord"
}

/**
 * Abstract base class for wiki scrapers
 *
 * Provides shared utilities for fetching and parsing wiki HTML.
 * Subclasses must implement mod-specific scraping methods.
 *
 * @abstract
 * @example
 * ```typescript
 * class VanillaScraper extends BaseWikiScraper {
 *   constructor() {
 *     super({
 *       wikiBaseUrl: "https://terraria.wiki.gg",
 *       modName: "vanilla",
 *       idRangeStart: 1
 *     })
 *   }
 *   // Implement scraping methods...
 * }
 * ```
 */
export abstract class BaseWikiScraper {
    protected config: ScraperConfig
    protected currentId: number

    constructor(config: ScraperConfig) {
        this.config = config
        this.currentId = config.idRangeStart
    }

    /**
     * Fetch HTML content from a wiki page
     *
     * Implements error handling, proper User-Agent, and logging.
     *
     * @param path - Wiki page path (e.g., "/wiki/Swords")
     * @returns Raw HTML string of the page
     * @throws {Error} If HTTP request fails or returns non-200 status
     *
     * @example
     * ```typescript
     * const html = await this.fetchPage("/wiki/Swords")
     * ```
     */
    protected async fetchPage(path: string): Promise<string> {
        const url = `${this.config.wikiBaseUrl}${path}`
        console.log(`Fetching: ${url}`)

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "TerrariaLoadoutMaker/1.0 (Educational Project)",
                },
            })

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                )
            }

            return await response.text()
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error)
            throw error
        }
    }

    /**
     * Load HTML string into Cheerio for DOM parsing
     *
     * @param html - Raw HTML string
     * @returns Cheerio API instance for DOM traversal
     *
     * @example
     * ```typescript
     * const $ = this.loadHtml(html)
     * const title = $('h1').text()
     * ```
     */
    protected loadHtml(html: string): cheerio.CheerioAPI {
        return cheerio.load(html)
    }

    /**
     * Parse rarity value from wiki text
     *
     * Rarity is difficult to extract reliably from wiki tables as it's often
     * represented with color-coded text or images. Returns 0 as safe default.
     *
     * @param text - Text potentially containing rarity information
     * @returns Rarity number (0-11), defaults to 0
     *
     * @example
     * ```typescript
     * const rarity = this.parseRarity("Rarity level: 3") // Returns 0 (not implemented)
     * ```
     */
    protected parseRarity(text: string): number {
        // Rarity is difficult to parse reliably from wiki tables
        // Return 0 as default since actual rarity varies by context
        return 0
    }

    /**
     * Parse damage value from wiki text
     *
     * Extracts numeric damage values from text like "45 damage" or "67 melee damage".
     *
     * @param text - Text containing damage information
     * @returns Damage number if found, undefined otherwise
     *
     * @example
     * ```typescript
     * const dmg = this.parseDamage("45 melee damage") // Returns 45
     * const none = this.parseDamage("No damage") // Returns undefined
     * ```
     */
    protected parseDamage(text: string): number | undefined {
        const match = text.match(
            /(\d+)\s*(?:damage|melee|ranged|magic|summon)/i
        )
        return match ? parseInt(match[1]) : undefined
    }

    /**
     * Parse defense from text (e.g., "12 defense" -> 12)
     */
    protected parseDefense(text: string): number | undefined {
        const match = text.match(/(\d+)\s*defense/i)
        return match ? parseInt(match[1]) : undefined
    }

    /**
     * Determine weapon class from damage type
     */
    protected parseWeaponClass(
        text: string
    ): "melee" | "ranged" | "magic" | "summoner" | undefined {
        const lower = text.toLowerCase()
        if (lower.includes("melee")) return "melee"
        if (
            lower.includes("ranged") ||
            lower.includes("arrow") ||
            lower.includes("bullet")
        )
            return "ranged"
        if (lower.includes("magic") || lower.includes("mana")) return "magic"
        if (lower.includes("summon") || lower.includes("minion"))
            return "summoner"
        return undefined
    }

    /**
     * Get next available ID
     */
    protected getNextId(): number {
        return this.currentId++
    }

    /**
     * Abstract methods to be implemented by specific scrapers
     */
    abstract scrapeWeapons(): Promise<ScrapedItem[]>
    abstract scrapeArmor(): Promise<ScrapedItem[]>
    abstract scrapeAccessories(): Promise<ScrapedItem[]>
    abstract scrapeBosses(): Promise<ScrapedBoss[]>
    abstract scrapeBuffs(): Promise<ScrapedItem[]>
}

/**
 * Helper to delay between requests (be nice to wikis)
 */
export async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Normalize item name for consistent formatting
 */
export function normalizeItemName(name: string): string {
    return name.trim().replace(/\s+/g, " ").replace(/['']/g, "'") // Normalize apostrophes
}
