/**
 * Main Wiki Scraper
 *
 * Orchestrates scraping from all configured Terraria wikis (Vanilla, Calamity, Thorium)
 * and generates JSON data files with standardized structure.
 *
 * This script:
 * - Uses Cheerio-based scrapers for static HTML content
 * - Assigns unique ID ranges per mod (Vanilla: 1-999, Calamity: 1000-1999, Thorium: 2000-2999)
 * - Generates separate files for items, ammunition, and bosses
 * - Adds "-scraped" suffix to avoid overwriting manual data
 * - Implements rate limiting to respect server load
 *
 * Generated Files:
 * - items-{mod}-scraped.json: Weapons and armor
 * - ammunition-{mod}-scraped.json: Ammunition types (arrows, bullets, rockets)
 * - bosses-{mod}-scraped.json: Boss data with progression order
 *
 * Note: Accessories and buffs require JavaScript rendering and are scraped
 * separately via Puppeteer (see scrape-js-sections.ts)
 *
 * @example
 * ```bash
 * # Run complete wiki scraping
 * pnpm tsx scripts/scrape-all-wikis.ts
 * ```
 *
 * @see {@link scrape-js-sections.ts} For JavaScript-rendered content (accessories, buffs)
 * @see {@link scrapers/base-scraper.ts} For shared scraping utilities
 */

import * as fs from "fs"
import * as path from "path"
import { VanillaScraper } from "./scrapers/vanilla-scraper"
import { CalamityScraper } from "./scrapers/calamity-scraper"
import { ThoriumScraper } from "./scrapers/thorium-scraper"
import { ScrapedItem, ScrapedBoss } from "./scrapers/base-scraper"

const DATA_DIR = path.join(process.cwd(), "data")

/**
 * Standardized Terraria item structure
 * Used for weapons and armor in the final JSON output
 */
interface TerrariaItem {
    /** Unique identifier (mod-specific ranges) */
    id: number
    /** Display name of the item */
    name: string
    /** Mod source: "vanilla", "calamity", or "thorium" */
    mod: string
    /** Item category: "weapon", "armor", etc. */
    type: string
    /** Rarity tier (0=common to 11=expert) */
    rarity: number
    /** Damage value (weapons only) */
    damage?: number
    /** Defense value (armor only) */
    defense?: number
    /** Armor piece type: "helmet", "chest", "legs" */
    armorType?: string
    /** Weapon damage class: "melee", "ranged", "magic", "summon", "rogue", etc. */
    weaponClass?: string
    /** Associated buff name (if applicable) */
    buff?: string
}

/**
 * Standardized ammunition structure
 * Used for arrows, bullets, rockets, and other projectiles
 */
interface TerrariaAmmo {
    /** Unique identifier (mod-specific ranges) */
    id: number
    /** Display name of the ammunition */
    name: string
    /** Mod source: "vanilla", "calamity", or "thorium" */
    mod: string
    /** Ammunition category: "arrow", "bullet", "rocket", etc. */
    type: string
    /** Base damage value (optional - not all ammo has fixed damage) */
    damage?: number
}

/**
 * Standardized boss structure
 * Used for boss progression and loadout targeting
 */
interface Boss {
    /** Unique identifier (mod-specific ranges) */
    id: number
    /** Display name of the boss */
    name: string
    /** Mod source: "vanilla", "calamity", or "thorium" */
    mod: string
    /** Progression stage: "pre-hardmode", "hardmode", "post-moonlord" */
    progression: string
    /** Sequential order number for progression sorting */
    order: number
}

/**
 * Scrape all Vanilla Terraria wiki content
 *
 * Fetches weapons, armor, bosses, and ammunition from the official Terraria wiki.
 * Does NOT scrape accessories or buffs (requires Puppeteer - see scrape-js-sections.ts).
 *
 * ID Range: 1-999
 * Wiki: https://terraria.wiki.gg
 *
 * @returns Promise that resolves when scraping and file generation is complete
 */
async function scrapeVanilla() {
    console.log("\n📖 === SCRAPING VANILLA TERRARIA ===\n")
    const scraper = new VanillaScraper()

    const weapons = await scraper.scrapeWeapons()
    const armor = await scraper.scrapeArmor()
    const accessories = await scraper.scrapeAccessories()
    const bosses = await scraper.scrapeBosses()
    const buffs = await scraper.scrapeBuffs()
    const ammunition = await scraper.scrapeAmmunition()

    // Convert to final format with IDs
    let idCounter = 1
    const items: TerrariaItem[] = []

    const weaponItems: TerrariaItem[] = weapons.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "vanilla",
    }))

    const armorItems: TerrariaItem[] = armor.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "vanilla",
    }))

    const ammoItems: TerrariaAmmo[] = ammunition.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "vanilla",
    }))

    const bossData: Boss[] = bosses.map((boss, index) => {
        // Assign order based on index to maintain boss progression
        let order = index + 1

        return {
            id: index + 1, // Vanilla bosses: 1-999
            ...boss,
            mod: "vanilla",
            order: order,
        }
    })

    // Combine items and deduplicate by name + type
    // Keep armor entries over weapon entries for items with "armor" in the name
    const allItems = [...weaponItems, ...armorItems]
    const itemMap = new Map<string, TerrariaItem>()

    allItems.forEach((item) => {
        const key = `${item.name.toLowerCase().trim()}-${item.type}`
        const existing = itemMap.get(key)

        if (!existing) {
            // First occurrence, add to map
            itemMap.set(key, item)
        } else if (item.type === "armor" && existing.type === "weapon") {
            // Replace weapon with armor if name contains "armor"
            if (item.name.toLowerCase().includes("armor")) {
                itemMap.set(key, item)
            }
        }
    })

    // Also deduplicate by just name (remove items with same name but different types if one is clearly wrong)
    const finalMap = new Map<string, TerrariaItem>()
    Array.from(itemMap.values()).forEach((item) => {
        const nameKey = item.name.toLowerCase().trim()
        const existing = finalMap.get(nameKey)

        if (!existing) {
            finalMap.set(nameKey, item)
        } else if (
            item.type === "armor" &&
            item.name.toLowerCase().includes("armor")
        ) {
            // Prefer armor type for items with "armor" in name
            finalMap.set(nameKey, item)
        } else if (
            item.type === "accessory" &&
            ["emblem", "stone", "charm"].some((t) =>
                item.name.toLowerCase().includes(t)
            )
        ) {
            // Prefer accessory type for emblems and similar items
            finalMap.set(nameKey, item)
        }
    })

    const deduplicatedItems = Array.from(finalMap.values())

    // Save files (accessories and buffs are handled by Puppeteer)
    fs.writeFileSync(
        path.join(DATA_DIR, "items-vanilla-scraped.json"),
        JSON.stringify(deduplicatedItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "ammunition-vanilla-scraped.json"),
        JSON.stringify(ammoItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "bosses-vanilla-scraped.json"),
        JSON.stringify(bossData, null, 2)
    )

    console.log(
        `\n✅ Vanilla complete: ${deduplicatedItems.length} total items (${weaponItems.length} weapons + ${armorItems.length} armor, deduplicated), ${ammoItems.length} ammunition, ${bossData.length} bosses\n`
    )
}

/**
 * Scrape all Calamity Mod wiki content
 *
 * Fetches weapons, armor, bosses, and ammunition from the Calamity Mod wiki.
 * Includes unique "Rogue" weapon class specific to Calamity.
 *
 * ID Range: 100000-199999
 * Wiki: https://calamitymod.wiki.gg
 *
 * @returns Promise that resolves when scraping and file generation is complete
 */
async function scrapeCalamity() {
    console.log("\n🔥 === SCRAPING CALAMITY MOD ===\n")
    const scraper = new CalamityScraper()

    const weapons = await scraper.scrapeWeapons()
    // Note: Armor is scraped separately via Puppeteer in scrape-js-sections.ts
    const accessories = await scraper.scrapeAccessories()
    const bosses = await scraper.scrapeBosses()
    const buffs = await scraper.scrapeBuffs()
    const ammunition = await scraper.scrapeAmmunition()

    let idCounter = 100000
    const items: TerrariaItem[] = []

    const weaponItems: TerrariaItem[] = weapons.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "calamity",
    }))

    const armorItems: TerrariaItem[] = [] // Armor scraped via Puppeteer

    const ammoItems: TerrariaAmmo[] = ammunition.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "calamity",
    }))

    const bossData: Boss[] = bosses.map((boss, index) => {
        // Assign order based on index to maintain boss progression
        let order = index + 1

        return {
            id: 100000 + index, // Calamity bosses: 100000-199999
            ...boss,
            mod: "calamity",
            order: order,
        }
    })

    // Deduplicate items by name
    const allItems = [...weaponItems, ...armorItems]
    const itemMap = new Map<string, TerrariaItem>()

    allItems.forEach((item) => {
        const nameKey = item.name.toLowerCase().trim()
        const existing = itemMap.get(nameKey)

        if (!existing) {
            itemMap.set(nameKey, item)
        } else if (
            item.type === "armor" &&
            item.name.toLowerCase().includes("armor")
        ) {
            itemMap.set(nameKey, item)
        }
    })

    const deduplicatedItems = Array.from(itemMap.values())

    fs.writeFileSync(
        path.join(DATA_DIR, "items-calamity-scraped.json"),
        JSON.stringify(deduplicatedItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "ammunition-calamity-scraped.json"),
        JSON.stringify(ammoItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "bosses-calamity-scraped.json"),
        JSON.stringify(bossData, null, 2)
    )

    console.log(
        `\n✅ Calamity complete: ${deduplicatedItems.length} total items (${weaponItems.length} weapons, armor via Puppeteer), ${ammoItems.length} ammunition, ${bossData.length} bosses\n`
    )
    console.log(
        "   ℹ️  Note: Calamity armor is scraped via Puppeteer (run 'pnpm scrape:js')\n"
    )
}

/**
 * Scrape all Thorium Mod wiki content
 *
 * Fetches weapons, armor, bosses, and ammunition from the Thorium Mod wiki.
 * Includes unique "Healer" and "Symphonic" weapon classes specific to Thorium.
 *
 * ID Range: 200000-299999
 * Wiki: https://thoriummod.wiki.gg
 *
 * @returns Promise that resolves when scraping and file generation is complete
 */
async function scrapeThorium() {
    console.log("\n⚡ === SCRAPING THORIUM MOD ===\n")
    const scraper = new ThoriumScraper()

    const weapons = await scraper.scrapeWeapons()
    const armor = await scraper.scrapeArmor()
    const accessories = await scraper.scrapeAccessories()
    const bosses = await scraper.scrapeBosses()
    const buffs = await scraper.scrapeBuffs()
    const ammunition = await scraper.scrapeAmmunition()

    let idCounter = 200000
    const items: TerrariaItem[] = []

    const weaponItems: TerrariaItem[] = weapons.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "thorium",
    }))

    const armorItems: TerrariaItem[] = armor.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "thorium",
    }))

    const ammoItems: TerrariaAmmo[] = ammunition.map((item) => ({
        id: idCounter++,
        ...item,
        mod: "thorium",
    }))

    const bossData: Boss[] = bosses.map((boss, index) => {
        // Assign order based on index to maintain boss progression
        let order = index + 1

        return {
            id: 200000 + index, // Thorium bosses: 200000-299999
            ...boss,
            mod: "thorium",
            order: order,
        }
    })

    // Deduplicate items by name
    const allItems = [...weaponItems, ...armorItems]
    const itemMap = new Map<string, TerrariaItem>()

    allItems.forEach((item) => {
        const nameKey = item.name.toLowerCase().trim()
        const existing = itemMap.get(nameKey)

        if (!existing) {
            itemMap.set(nameKey, item)
        } else if (
            item.type === "armor" &&
            item.name.toLowerCase().includes("armor")
        ) {
            itemMap.set(nameKey, item)
        }
    })

    const deduplicatedItems = Array.from(itemMap.values())

    fs.writeFileSync(
        path.join(DATA_DIR, "items-thorium-scraped.json"),
        JSON.stringify(deduplicatedItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "ammunition-thorium-scraped.json"),
        JSON.stringify(ammoItems, null, 2)
    )
    fs.writeFileSync(
        path.join(DATA_DIR, "bosses-thorium-scraped.json"),
        JSON.stringify(bossData, null, 2)
    )

    console.log(
        `\n✅ Thorium complete: ${deduplicatedItems.length} total items (${weaponItems.length} weapons + ${armorItems.length} armor, deduplicated), ${ammoItems.length} ammunition, ${bossData.length} bosses\n`
    )
}

/**
 * Main entry point for wiki scraping
 *
 * Orchestrates sequential scraping of all three wikis (Vanilla, Calamity, Thorium).
 * Generates JSON files in the data/ directory with "-scraped" suffix.
 *
 * Process:
 * 1. Scrape Vanilla Terraria wiki (official content)
 * 2. Scrape Calamity Mod wiki (large overhaul mod)
 * 3. Scrape Thorium Mod wiki (class-focused mod)
 * 4. Generate summary of created files
 *
 * Rate Limiting: Implements delays between requests to respect server load
 * Error Handling: Catches and logs errors without stopping entire process
 *
 * @throws {Error} If data directory doesn't exist or is not writable
 */
async function main() {
    console.log("🚀 Starting Wiki Scraping Process...")
    console.log("⚠️  This will take several minutes due to rate limiting")
    console.log(
        '⚠️  Generated files will have "-scraped" suffix to avoid overwriting current data\n'
    )

    try {
        // Scrape all wikis
        await scrapeVanilla()
        await scrapeCalamity()
        await scrapeThorium()

        console.log("\n✨ === SCRAPING COMPLETE ===")
        console.log("\n📁 Generated files in data/ directory:")
        console.log("   Items (weapons + armor):")
        console.log("      - items-vanilla-scraped.json")
        console.log("      - items-calamity-scraped.json")
        console.log("      - items-thorium-scraped.json")
        console.log("   Ammunition:")
        console.log("      - ammunition-vanilla-scraped.json")
        console.log("      - ammunition-calamity-scraped.json")
        console.log("      - ammunition-thorium-scraped.json")
        console.log("   Bosses:")
        console.log("      - bosses-vanilla-scraped.json")
        console.log("      - bosses-calamity-scraped.json")
        console.log("      - bosses-thorium-scraped.json")
        console.log(
            "\n💡 Note: Accessories and buffs are scraped separately via Puppeteer (pnpm scrape:js)"
        )
        console.log(
            "\n💡 Review the scraped data and merge with existing files as needed"
        )
    } catch (error) {
        console.error("\n❌ Scraping failed:", error)
        process.exit(1)
    }
}

main().catch(console.error)
