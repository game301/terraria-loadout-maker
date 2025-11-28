/**
 * Merge Scraped Data into App Files
 *
 * Consolidates data from multiple scraper outputs into the final JSON files used by the app.
 * Combines weapons, armor, and accessories into items-{mod}.json files, and merges other
 * categories (buffs, ammunition, bosses) into their respective files.
 *
 * Source Files:
 * - items-{mod}-scraped.json (weapons + armor from Cheerio scraper)
 * - items-{mod}-accessories-js-puppeteer.json (accessories from Puppeteer)
 * - items-calamity-armor-js-puppeteer.json (Calamity armor from Puppeteer)
 * - buffs-{mod}-js-puppeteer.json (buffs/potions from Puppeteer)
 * - ammunition-{mod}-scraped.json (ammunition from Cheerio scraper)
 * - bosses-{mod}-scraped.json (bosses from Cheerio scraper)
 *
 * Output Files (used by app):
 * - items-{mod}.json (weapons + armor + accessories combined)
 * - buffs-{mod}.json (buffs/potions)
 * - ammunition-{mod}.json (ammunition)
 * - bosses-{mod}.json (bosses)
 *
 * @example
 * ```bash
 * # Merge all scraped data into app files
 * pnpm tsx scripts/merge-scraped-data.ts
 *
 * # Or use the package.json script
 * pnpm merge
 * ```
 */

import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

interface Item {
    id: number
    name: string
    type: string
    mod: string
    rarity: number
    damage?: number
    defense?: number
    armorType?: string
    weaponClass?: string
}

interface Buff {
    id: number
    name: string
    type: string
    mod: string
    rarity: number
    buff?: string
}

interface Ammo {
    id: number
    name: string
    type: string
    mod: string
    damage?: number
}

interface Boss {
    id: number
    name: string
    mod: string
    progression: string
    order: number
}

/**
 * Read JSON file safely, return empty array if file doesn't exist
 */
function readJsonFile<T>(filename: string): T[] {
    const filepath = path.join(DATA_DIR, filename)
    try {
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, "utf-8")
            return JSON.parse(content)
        }
    } catch (error) {
        console.warn(`⚠️  Failed to read ${filename}:`, error)
    }
    return []
}

/**
 * Write JSON file with pretty formatting
 */
function writeJsonFile<T>(filename: string, data: T[]): void {
    const filepath = path.join(DATA_DIR, filename)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
}

/**
 * Remove duplicates based on name, prioritizing vanilla items
 * If same item exists in multiple mods, keep only the vanilla version
 */
function deduplicateItems<T extends { name: string; mod: string }>(
    items: T[]
): T[] {
    const seen = new Map<string, T>()

    items.forEach((item) => {
        const key = item.name.toLowerCase()
        const existing = seen.get(key)

        if (!existing) {
            // First occurrence, add to map
            seen.set(key, item)
        } else if (item.mod === "vanilla" && existing.mod !== "vanilla") {
            // Replace mod item with vanilla version
            seen.set(key, item)
        }
        // Otherwise keep existing (already vanilla or first occurrence)
    })

    return Array.from(seen.values())
}

/**
 * Merge items for a specific mod
 */
function mergeModItems(mod: string): void {
    console.log(`\n📦 Merging ${mod} items...`)

    // Read all source files
    const scrapedItems = readJsonFile<Item>(`items-${mod}-scraped.json`)
    const accessories = readJsonFile<Item>(
        `items-${mod}-accessories-js-puppeteer.json`
    )

    // For Calamity, also read the separate armor file
    let puppeteerArmor: Item[] = []
    if (mod === "calamity") {
        puppeteerArmor = readJsonFile<Item>(
            `items-calamity-armor-js-puppeteer.json`
        )
        console.log(
            `   Found ${puppeteerArmor.length} armor pieces from Puppeteer`
        )
    }

    // Combine all items
    let allItems = [...scrapedItems, ...accessories, ...puppeteerArmor]

    // Deduplicate
    const beforeCount = allItems.length
    allItems = deduplicateItems(allItems)
    const dedupedCount = beforeCount - allItems.length

    // Sort by ID
    allItems.sort((a, b) => a.id - b.id)

    // Write merged file
    writeJsonFile(`items-${mod}.json`, allItems)

    console.log(`   ✅ Merged ${allItems.length} items`)
    console.log(
        `      - Weapons: ${allItems.filter((i) => i.type === "weapon").length}`
    )
    console.log(
        `      - Armor: ${allItems.filter((i) => i.type === "armor").length}`
    )
    console.log(
        `      - Accessories: ${
            allItems.filter((i) => i.type === "accessory").length
        }`
    )
    if (dedupedCount > 0) {
        console.log(`      - Removed ${dedupedCount} duplicates`)
    }
}

/**
 * Merge buffs for a specific mod
 */
function mergeModBuffs(mod: string): void {
    const buffs = readJsonFile<Buff>(`buffs-${mod}-js-puppeteer.json`)

    if (buffs.length > 0) {
        // Sort by ID
        buffs.sort((a, b) => a.id - b.id)
        writeJsonFile(`buffs-${mod}.json`, buffs)
        console.log(`   ✅ Merged ${buffs.length} buffs`)
    }
}

/**
 * Merge ammunition for a specific mod
 */
function mergeModAmmunition(mod: string): void {
    let ammo = readJsonFile<Ammo>(`ammunition-${mod}-scraped.json`)

    if (ammo.length > 0) {
        // Filter out invalid ammunition names
        const beforeCount = ammo.length
        ammo = ammo.filter((item) => {
            const name = item.name.toLowerCase()
            // Filter out generic/invalid names
            return (
                !name.includes("item id") &&
                name.length > 2 &&
                !name.includes("undefined")
            )
        })
        const filteredCount = beforeCount - ammo.length

        // Sort by ID
        ammo.sort((a, b) => a.id - b.id)
        writeJsonFile(`ammunition-${mod}.json`, ammo)
        console.log(`   ✅ Merged ${ammo.length} ammunition items`)
        if (filteredCount > 0) {
            console.log(`      - Filtered ${filteredCount} invalid items`)
        }
    }
}

/**
 * Merge bosses for a specific mod
 */
function mergeModBosses(mod: string): void {
    const bosses = readJsonFile<Boss>(`bosses-${mod}-scraped.json`)

    if (bosses.length > 0) {
        // Sort by order (progression)
        bosses.sort((a, b) => a.order - b.order)
        writeJsonFile(`bosses-${mod}.json`, bosses)
        console.log(`   ✅ Merged ${bosses.length} bosses`)
    }
}

/**
 * Main merge function
 */
async function main() {
    console.log("🔄 Starting data merge process...")
    console.log("   Combining scraped data into app files\n")

    const mods = ["vanilla", "calamity", "thorium"]

    for (const mod of mods) {
        console.log(`\n${"=".repeat(50)}`)
        console.log(`  ${mod.toUpperCase()}`)
        console.log("=".repeat(50))

        mergeModItems(mod)
        mergeModBuffs(mod)
        mergeModAmmunition(mod)
        mergeModBosses(mod)
    }

    // Cross-mod deduplication: Remove items from mod files that exist in vanilla
    console.log(`\n${"=".repeat(50)}`)
    console.log(`  CROSS-MOD DEDUPLICATION`)
    console.log("=".repeat(50))

    const vanillaItems = readJsonFile<Item>("items-vanilla.json")
    const vanillaNames = new Set(vanillaItems.map((i) => i.name.toLowerCase()))

    for (const mod of ["calamity", "thorium"]) {
        let modItems = readJsonFile<Item>(`items-${mod}.json`)
        const beforeCount = modItems.length

        // Remove items that exist in vanilla
        modItems = modItems.filter(
            (item) => !vanillaNames.has(item.name.toLowerCase())
        )

        const removedCount = beforeCount - modItems.length
        if (removedCount > 0) {
            modItems.sort((a, b) => a.id - b.id)
            writeJsonFile(`items-${mod}.json`, modItems)
            console.log(
                `   ✅ ${mod}: Removed ${removedCount} vanilla duplicates (${modItems.length} items remain)`
            )
        }
    }

    console.log("\n\n✨ === MERGE COMPLETE ===\n")
    console.log("📁 Generated files in data/ directory:")
    console.log("   Items (weapons + armor + accessories):")
    console.log("      - items-vanilla.json")
    console.log("      - items-calamity.json")
    console.log("      - items-thorium.json")
    console.log("   Buffs:")
    console.log("      - buffs-vanilla.json")
    console.log("      - buffs-calamity.json")
    console.log("      - buffs-thorium.json")
    console.log("   Ammunition:")
    console.log("      - ammunition-vanilla.json")
    console.log("      - ammunition-calamity.json")
    console.log("      - ammunition-thorium.json")
    console.log("   Bosses:")
    console.log("      - bosses-vanilla.json")
    console.log("      - bosses-calamity.json")
    console.log("      - bosses-thorium.json")
    console.log("\n✅ App is now ready to use the merged data!")
}

main().catch(console.error)
