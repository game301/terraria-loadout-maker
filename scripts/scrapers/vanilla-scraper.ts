/**
 * Vanilla Terraria Wiki Scraper
 *
 * Scrapes items from the official Terraria Wiki (terraria.wiki.gg)
 */

import {
    BaseWikiScraper,
    ScrapedItem,
    ScrapedBoss,
    delay,
    normalizeItemName,
} from "./base-scraper"

/**
 * Determine armor slot based on item name
 */
function getArmorSlot(
    name: string
): "helmet" | "chestplate" | "leggings" | undefined {
    const nameLower = name.toLowerCase()

    // Helmet slot keywords
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
        nameLower.includes("helm")
    ) {
        return "helmet"
    }

    // Chestplate slot keywords
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
        nameLower.includes("scalemail")
    ) {
        return "chestplate"
    }

    // Leggings slot keywords
    if (
        nameLower.includes("leggings") ||
        nameLower.includes("greaves") ||
        nameLower.includes("pants") ||
        nameLower.includes("skirt") ||
        nameLower.includes("boots") ||
        nameLower.includes("subligar") ||
        nameLower.includes("leg armor") ||
        nameLower.includes("cuisses") ||
        nameLower.includes("legs")
    ) {
        return "leggings"
    }

    return undefined
}

/**
 * Clean version text from item names
 * Removes text like "(Desktop, Console and Mobile versions)"
 */
function cleanVersionText(name: string): string {
    return name
        .replace(/\([^)]*(?:Desktop|Console|Mobile|Old-gen|3DS)[^)]*\)/gi, "")
        .trim()
}

export class VanillaScraper extends BaseWikiScraper {
    constructor() {
        super({
            wikiBaseUrl: "https://terraria.wiki.gg",
            modName: "vanilla",
            idRangeStart: 1,
        })
    }

    /**
     * Scrape weapons from the Weapons page
     */
    async scrapeWeapons(): Promise<ScrapedItem[]> {
        console.log("🗡️  Scraping vanilla weapons...")
        const items: ScrapedItem[] = []

        try {
            // Use the List of weapons page which has all weapons in sortable tables
            await delay(1000)
            const html = await this.fetchPage("/wiki/List_of_weapons")
            const $ = this.loadHtml(html)

            // Parse weapon tables - Terraria wiki uses class="terraria sortable"
            $("table.terraria.sortable tbody tr").each((_, row) => {
                const $row = $(row)

                // Skip header rows
                if ($row.find("th").length > 0) return

                // Find the item name - on List_of_weapons it's in the second cell (first is image)
                const nameCell = $row.find("td").eq(1)
                const nameLink = nameCell.find("a").first()
                const name = normalizeItemName(nameLink.text())

                if (!name) return

                // Parse damage from bold text in first data column after name
                const damageCell = $row.find("td").eq(2) // Third column (0-indexed)
                const damageText = damageCell.find("b").text()
                const damage = damageText ? parseInt(damageText) : undefined

                // Parse weapon class from damage type column
                const typeCell = $row.find("td").eq(3)
                const typeText = typeCell.text().toLowerCase()
                let weaponClass:
                    | "melee"
                    | "ranged"
                    | "magic"
                    | "summoner"
                    | undefined
                if (typeText.includes("melee")) {
                    weaponClass = "melee"
                } else if (typeText.includes("ranged")) {
                    weaponClass = "ranged"
                } else if (typeText.includes("magic")) {
                    weaponClass = "magic"
                } else if (typeText.includes("summon")) {
                    weaponClass = "summoner"
                }

                // Parse rarity from image alt text
                const rarityImg = $row.find('img[alt*="Rarity level"]')
                const rarityText = rarityImg.attr("alt") || ""
                const rarity = this.parseRarity(rarityText)

                items.push({
                    name,
                    type: "weapon",
                    rarity,
                    damage,
                    weaponClass,
                })
            })

            console.log(`✅ Scraped ${items.length} vanilla weapons`)
        } catch (error) {
            console.error("Failed to scrape vanilla weapons:", error)
        }

        return items
    }

    /**
     * Scrape armor from the Guide:Armor_progression page
     */
    async scrapeArmor(): Promise<ScrapedItem[]> {
        console.log("🛡️  Scraping vanilla armor...")
        const items: ScrapedItem[] = []

        try {
            await delay(1000)
            const html = await this.fetchPage("/wiki/Guide:Armor_progression")
            const $ = this.loadHtml(html)

            // Parse armor progression tables - they have Head, Chest, Legs columns
            $("table.terraria tbody tr").each((_, row) => {
                const $row = $(row)

                // Skip header rows
                if ($row.find("th").length > 0) return

                const cells = $row.find("td")
                if (cells.length < 3) return

                // Find Head, Chest, Legs columns
                // Typically: first few cells might be icons/class, then Head, Chest, Legs
                const armorCells: Array<{
                    cell: any
                    type: "helmet" | "chestplate" | "leggings"
                }> = []

                // Try to identify armor columns by looking for armor links
                cells.each((index, cell) => {
                    const $cell = $(cell)
                    const links = $cell.find("a")

                    // Each cell might have multiple armor pieces (like "X Mask/X Helmet")
                    links.each((_, link) => {
                        const linkText = $(link).text().trim()
                        if (!linkText || linkText.length < 3) return

                        // Determine armor type from the name
                        const armorType = getArmorSlot(linkText)
                        if (armorType) {
                            armorCells.push({ cell: link, type: armorType })
                        }
                    })
                })

                // Process each armor piece found in the row
                armorCells.forEach(({ cell, type: armorType }) => {
                    const $link = $(cell)
                    let name = normalizeItemName($link.text())

                    if (!name || name.length < 3) return

                    // Clean version text from name
                    name = cleanVersionText(name)

                    // Try to find defense value in nearby cells or the same cell
                    let defense = 0
                    const parentCell = $link.closest("td")
                    const cellText = parentCell.text()

                    // Look for defense number (usually in parentheses or nearby)
                    const defenseMatch = cellText.match(/(\d+)\s*def/)
                    if (defenseMatch) {
                        defense = parseInt(defenseMatch[1])
                    }

                    // Parse rarity from the row
                    const rarityImg = $link
                        .closest("tr")
                        .find('img[alt*="Rarity level"]')
                        .first()
                    const rarityText = rarityImg.attr("alt") || ""
                    const rarity = this.parseRarity(rarityText)

                    items.push({
                        name,
                        type: "armor",
                        rarity,
                        defense,
                        armorType,
                    })
                })
            })

            console.log(`✅ Scraped ${items.length} vanilla armor pieces`)
        } catch (error) {
            console.error("Failed to scrape vanilla armor:", error)
        }

        return items
    }

    /**
     * Scrape accessories from the Accessories page
     */
    async scrapeAccessories(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered accessories
        return []
    }

    /**
     * Scrape bosses from the Bosses page
     */
    async scrapeBosses(): Promise<ScrapedBoss[]> {
        console.log("👹 Scraping vanilla bosses...")
        const bosses: ScrapedBoss[] = []

        try {
            await delay(1000)
            const html = await this.fetchPage("/wiki/Bosses")
            const $ = this.loadHtml(html)

            // Pre-hardmode bosses
            const preHardmodeNames = [
                "King Slime",
                "Eye of Cthulhu",
                "Eater of Worlds",
                "Brain of Cthulhu",
                "Queen Bee",
                "Skeletron",
                "Deerclops",
                "Wall of Flesh",
            ]

            // Hardmode bosses
            const hardmodeNames = [
                "Queen Slime",
                "The Twins",
                "The Destroyer",
                "Skeletron Prime",
                "Plantera",
                "Golem",
                "Duke Fishron",
                "Empress of Light",
                "Lunatic Cultist",
            ]

            // Post-Moon Lord
            const postMoonLordNames = ["Moon Lord"]

            preHardmodeNames.forEach((name) => {
                bosses.push({ name, progression: "pre-hardmode" })
            })

            hardmodeNames.forEach((name) => {
                bosses.push({ name, progression: "hardmode" })
            })

            postMoonLordNames.forEach((name) => {
                bosses.push({ name, progression: "post-moonlord" })
            })

            console.log(`✅ Scraped ${bosses.length} vanilla bosses`)
        } catch (error) {
            console.error("Failed to scrape vanilla bosses:", error)
        }

        return bosses
    }

    /**
     * Scrape buffs/potions from the Buffs page
     */
    async scrapeBuffs(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered potions
        return []
    }

    async scrapeAmmunition(): Promise<ScrapedItem[]> {
        console.log("🏹 Scraping vanilla ammunition...")
        const items: ScrapedItem[] = []

        try {
            const ammoPages = [
                "/wiki/Arrows",
                "/wiki/Bullets",
                "/wiki/Rockets",
                "/wiki/Darts",
                "/wiki/Flares",
            ]

            for (const page of ammoPages) {
                await delay(1000)
                const html = await this.fetchPage(page)
                const $ = this.loadHtml(html)

                $("table.terraria.sortable tbody tr").each((_, row) => {
                    const $row = $(row)

                    // Skip header rows
                    if ($row.find("th").length > 0) return

                    // Find item name in td.il2c
                    const nameLink = $row.find("td.il2c a").first()
                    const name = normalizeItemName(nameLink.text())

                    if (!name || name.includes("Endless")) return // Skip endless pouches

                    const damageText = $row.find("td").eq(2).text()
                    const damage = this.parseDamage(damageText)
                    const rarityImg = $row.find('img[alt*="Rarity level"]')
                    const rarity = rarityImg.length
                        ? this.parseRarity(rarityImg.attr("alt") || "")
                        : 0

                    items.push({
                        name,
                        type: "ammunition",
                        rarity,
                        damage,
                    })
                })
            }

            console.log(`✅ Scraped ${items.length} vanilla ammunition`)
        } catch (error) {
            console.error("Failed to scrape vanilla ammunition:", error)
        }

        return items
    }
}
