/**
 * Puppeteer-based JavaScript Section Scraper
 *
 * Scrapes JavaScript-rendered wiki sections that cannot be accessed with static HTML scrapers.
 * Uses Puppeteer with Cloudflare bypass (puppeteer-extra + stealth plugin) to access
 * collapsible wiki tables containing accessories, buffs/potions, and armor.
 *
 * Why Puppeteer is Needed:
 * - Wiki tables are wrapped in JavaScript-collapsed sections (.mw-collapsible)
 * - Content is dynamically loaded/revealed on click
 * - Static Cheerio scrapers see "Click/tap here to reveal" instead of actual data
 * - Cloudflare protection blocks headless browsers without stealth plugin
 *
 * Scraped Content:
 * - **Accessories**: Equipment items that provide passive buffs (up to 7 equipped)
 * - **Buffs/Potions**: Consumable items that provide temporary status effects
 * - **Calamity Armor**: Armor pieces from Calamity's Guide:Armor_progression (JS-collapsed)
 *
 * Generated Files:
 * - items-{mod}-accessories-js-puppeteer.json: Accessory items
 * - buffs-{mod}-js-puppeteer.json: Potion/buff items
 * - items-calamity-armor-js-puppeteer.json: Calamity armor pieces
 *
 * Limitations:
 * - Vanilla wiki uses different JavaScript structure (returns 0 items)
 * - Slower than Cheerio due to browser automation overhead
 * - Requires headless Chrome/Chromium installation
 *
 * @example
 * ```bash
 * # Run Puppeteer scraping for all mods
 * pnpm tsx scripts/scrape-js-sections.ts
 *
 * # Or use the package.json script
 * pnpm scrape:js
 * ```
 *
 * @module scrape-js-sections
 * @see {@link scrapers/puppeteer-universal-scraper} For the actual scraping logic
 * @see {@link scrape-all-wikis} For static HTML scraping (weapons, bosses, ammunition)
 */

import { writeFileSync } from "fs"
import { join } from "path"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import {
    UniversalPuppeteerScraper,
    ScrapedItem,
} from "./scrapers/puppeteer-universal-scraper"

puppeteer.use(StealthPlugin())

/**
 * Final item structure for JSON output
 */
interface SavedItem {
    /** Unique identifier (mod-specific range) */
    id: number
    /** Display name of the item */
    name: string
    /** Item type: "accessory", "potion", or "armor" */
    type: string
    /** Rarity tier (0-11) */
    rarity: number
    /** Mod source: "vanilla", "calamity", or "thorium" */
    mod: string
    /** Associated buff name (potions only) */
    buff?: string
    /** Defense value (armor only) */
    defense?: number
    /** Armor piece type: "helmet", "chestplate", "leggings" (armor only) */
    armorType?: "helmet" | "chestplate" | "leggings"
}

/**
 * Determine armor slot based on item name
 */
function getArmorSlot(
    name: string
): "helmet" | "chestplate" | "leggings" | undefined {
    const nameLower = name.toLowerCase()

    if (
        nameLower.includes("helmet") ||
        nameLower.includes("hat") ||
        nameLower.includes("hood") ||
        nameLower.includes("mask") ||
        nameLower.includes("headgear") ||
        nameLower.includes("cap") ||
        nameLower.includes("crown") ||
        nameLower.includes("visor") ||
        nameLower.includes("headpiece") ||
        nameLower.includes("visage") ||
        nameLower.includes("faceguard") ||
        nameLower.includes("helm")
    ) {
        return "helmet"
    }

    if (
        nameLower.includes("breastplate") ||
        nameLower.includes("chestplate") ||
        nameLower.includes("mail") ||
        nameLower.includes("shirt") ||
        nameLower.includes("tunic") ||
        nameLower.includes("robe") ||
        nameLower.includes("coat") ||
        nameLower.includes("plate") ||
        nameLower.includes("vest") ||
        nameLower.includes("body armor") ||
        nameLower.includes("robes")
    ) {
        return "chestplate"
    }

    if (
        nameLower.includes("leggings") ||
        nameLower.includes("greaves") ||
        nameLower.includes("pants") ||
        nameLower.includes("skirt") ||
        nameLower.includes("boots") ||
        nameLower.includes("leg") ||
        nameLower.includes("cuisses") ||
        nameLower.includes("legs") ||
        nameLower.includes("subligar") ||
        nameLower.includes("treads")
    ) {
        return "leggings"
    }

    return undefined
}

/**
 * Scrape Calamity armor from Guide:Armor_progression
 * Uses Puppeteer to expand JS-collapsed sections and extract armor pieces
 */
async function scrapeCalamityArmor(): Promise<SavedItem[]> {
    console.log("   🛡️  Scraping Calamity armor (JS-collapsed sections)...")

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    const armors: SavedItem[] = []
    let idCounter = 100000

    try {
        const url = "https://calamitymod.wiki.gg/wiki/Guide:Armor_progression"
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

        // Wait for collapsible elements
        await page.waitForSelector(".mw-collapsible", { timeout: 10000 })

        // Expand collapsible sections
        const expandedCount = await page.evaluate(() => {
            let count = 0
            const collapsibles = document.querySelectorAll(".mw-collapsible")
            collapsibles.forEach((collapsible) => {
                const toggleLink = collapsible.querySelector(
                    ".mw-collapsible-toggle a, .mw-collapsible-toggle"
                )
                if (toggleLink) {
                    ;(toggleLink as HTMLElement).click()
                    count++
                }
            })
            return count
        })

        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Click reveal links
        const revealedCount = await page.evaluate(() => {
            let count = 0
            const revealLinks = document.querySelectorAll("a")
            revealLinks.forEach((link) => {
                if (
                    link.textContent?.includes("Click") &&
                    link.textContent?.includes("reveal")
                ) {
                    ;(link as HTMLElement).click()
                    count++
                }
            })
            return count
        })

        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Extract armor data
        const scrapedData = await page.evaluate(() => {
            const results: Array<{ name: string; defense: number }> = []
            const tables = document.querySelectorAll("table")

            tables.forEach((table) => {
                const rows = table.querySelectorAll("tr")
                rows.forEach((row) => {
                    if (row.querySelectorAll("th").length > 0) return
                    const cells = row.querySelectorAll("td")
                    if (cells.length === 0) return

                    cells.forEach((cell) => {
                        const links = cell.querySelectorAll("a")
                        links.forEach((link) => {
                            const name = link.textContent?.trim()
                            if (!name || name.length < 3) return

                            const cellText = cell.textContent || ""
                            const defMatch = cellText.match(/(\\d+)\\s*def/)
                            const defense = defMatch ? parseInt(defMatch[1]) : 0

                            results.push({ name, defense })
                        })
                    })
                })
            })

            return results
        })

        // Process and filter armor pieces
        for (const item of scrapedData) {
            const armorType = getArmorSlot(item.name)
            if (!armorType) continue
            if (armors.find((a) => a.name === item.name)) continue

            armors.push({
                id: idCounter++,
                name: item.name,
                mod: "calamity",
                type: "armor",
                rarity: 0,
                defense: item.defense,
                armorType,
            })
        }

        console.log(`   ✅ Scraped ${armors.length} Calamity armor pieces`)
        console.log(
            `      - Helmets: ${
                armors.filter((a) => a.armorType === "helmet").length
            }`
        )
        console.log(
            `      - Chestplates: ${
                armors.filter((a) => a.armorType === "chestplate").length
            }`
        )
        console.log(
            `      - Leggings: ${
                armors.filter((a) => a.armorType === "leggings").length
            }`
        )
    } catch (error) {
        console.error("   ❌ Failed to scrape Calamity armor:", error)
    } finally {
        await browser.close()
    }

    return armors
}

/**
 * Main orchestration function for Puppeteer scraping
 *
 * Coordinates scraping across all three mods (Vanilla, Calamity, Thorium).
 * Generates separate JSON files for accessories and buffs for each mod.
 *
 * Process:
 * 1. Initialize scraper for each mod with correct wiki URL and ID range
 * 2. Scrape accessories and buffs using browser automation
 * 3. Assign sequential IDs within mod-specific ranges
 * 4. Write JSON files to data/ directory
 * 5. Display summary statistics
 *
 * Performance:
 * - Takes several minutes due to browser startup and page loading
 * - Implements delays to avoid overwhelming servers
 * - May fail if Cloudflare protection is updated
 *
 * @returns Promise that resolves when all scraping and file generation is complete
 * @throws {Error} If browser fails to launch or pages fail to load
 */
async function main() {
    console.log("🚀 Starting Puppeteer scraping for JavaScript sections...")
    console.log(
        "\nThis will scrape accessories and buffs that require JavaScript rendering.\n"
    )

    const startTime = Date.now()

    // Define scrapers for all three mods
    const scrapers = [
        {
            name: "Vanilla",
            icon: "🌟",
            scraper: new UniversalPuppeteerScraper({
                wikiBaseUrl: "https://terraria.wiki.gg",
                modName: "vanilla",
                idRangeStart: 1,
            }),
        },
        {
            name: "Calamity",
            icon: "🔥",
            scraper: new UniversalPuppeteerScraper({
                wikiBaseUrl: "https://calamitymod.wiki.gg",
                modName: "calamity",
                idRangeStart: 100000,
            }),
        },
        {
            name: "Thorium",
            icon: "⚡",
            scraper: new UniversalPuppeteerScraper({
                wikiBaseUrl: "https://thoriummod.wiki.gg",
                modName: "thorium",
                idRangeStart: 200000,
            }),
        },
    ]

    const results: {
        [mod: string]: { accessories: number; buffs: number; armor?: number }
    } = {}

    for (const { name, icon, scraper } of scrapers) {
        console.log(
            `${icon} === SCRAPING ${name.toUpperCase()} JS SECTIONS ===\n`
        )

        try {
            const { accessories, buffs } = await scraper.scrapeAll()

            // Assign IDs and save accessories
            let currentId = scraper["idRangeStart"]
            const accessoryItems: SavedItem[] = []

            for (const item of accessories) {
                accessoryItems.push({
                    id: currentId++,
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    mod: scraper["modName"],
                })
            }

            // Save accessories to separate file
            const accessoryFilename = `items-${scraper["modName"]}-accessories-js-puppeteer.json`
            const accessoryFilepath = join(
                process.cwd(),
                "data",
                accessoryFilename
            )
            writeFileSync(
                accessoryFilepath,
                JSON.stringify(accessoryItems, null, 2)
            )

            // Save buffs to separate file
            const buffItems: SavedItem[] = []
            for (const item of buffs) {
                buffItems.push({
                    id: currentId++,
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    mod: scraper["modName"],
                    buff: item.buff,
                })
            }

            const buffFilename = `buffs-${scraper["modName"]}-js-puppeteer.json`
            const buffFilepath = join(process.cwd(), "data", buffFilename)
            writeFileSync(buffFilepath, JSON.stringify(buffItems, null, 2))

            // Scrape Calamity armor separately (requires special handling)
            let armorCount = 0
            if (name === "Calamity") {
                const calamityArmor = await scrapeCalamityArmor()
                armorCount = calamityArmor.length

                const armorFilename = `items-calamity-armor-js-puppeteer.json`
                const armorFilepath = join(process.cwd(), "data", armorFilename)
                writeFileSync(
                    armorFilepath,
                    JSON.stringify(calamityArmor, null, 2)
                )
            }

            console.log(
                `✅ ${name} complete: ${
                    accessoryItems.length + buffItems.length + armorCount
                } items`
            )
            console.log(`   - Accessories: ${accessories.length}`)
            console.log(`   - Buffs/Potions: ${buffs.length}`)
            if (armorCount > 0) {
                console.log(`   - Armor: ${armorCount}`)
            }
            console.log()

            results[name] = {
                accessories: accessories.length,
                buffs: buffs.length,
                ...(armorCount > 0 && { armor: armorCount }),
            }
        } catch (error) {
            console.error(`❌ Failed to scrape ${name}:`, error)
            results[name] = { accessories: 0, buffs: 0 }
        }
    }

    const endTime = Date.now()
    const totalTime = ((endTime - startTime) / 1000).toFixed(1)

    console.log("\n✨ === SCRAPING COMPLETE ===\n")
    console.log(`⏱️  Total time: ${totalTime}s`)

    const totalItems = Object.values(results).reduce(
        (sum, r) => sum + r.accessories + r.buffs + (r.armor || 0),
        0
    )
    console.log(`📦 Total items scraped: ${totalItems}`)

    for (const [mod, counts] of Object.entries(results)) {
        const total = counts.accessories + counts.buffs + (counts.armor || 0)
        console.log(`   - ${mod}: ${total}`)
    }

    console.log("\n📁 Generated files in data/ directory:")
    console.log("   Accessories:")
    console.log("      - items-vanilla-accessories-js-puppeteer.json")
    console.log("      - items-calamity-accessories-js-puppeteer.json")
    console.log("      - items-thorium-accessories-js-puppeteer.json")
    console.log("   Buffs/Potions:")
    console.log("      - buffs-vanilla-js-puppeteer.json")
    console.log("      - buffs-calamity-js-puppeteer.json")
    console.log("      - buffs-thorium-js-puppeteer.json")
    console.log("   Armor:")
    console.log("      - items-calamity-armor-js-puppeteer.json")
}

main().catch(console.error)
