/**
 * Thorium Mod Wiki Scraper
 *
 * Scrapes items from the Thorium Mod Wiki (thoriummod.wiki.gg)
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

    if (
        nameLower.includes("breastplate") ||
        nameLower.includes("chestplate") ||
        nameLower.includes("mail") ||
        nameLower.includes("shirt") ||
        nameLower.includes("tunic") ||
        nameLower.includes("robe") ||
        nameLower.includes("coat") ||
        nameLower.includes("plate") ||
        nameLower.includes("vest")
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
        nameLower.includes("legs")
    ) {
        return "leggings"
    }

    return undefined
}

export class ThoriumScraper extends BaseWikiScraper {
    constructor() {
        super({
            wikiBaseUrl: "https://thoriummod.wiki.gg",
            modName: "thorium",
            idRangeStart: 200000,
        })
    }

    async scrapeWeapons(): Promise<ScrapedItem[]> {
        console.log("⚡ Scraping Thorium weapons...")
        const items: ScrapedItem[] = []

        try {
            // Use the List of weapons page which has all weapons in sortable tables
            await delay(1000)
            const html = await this.fetchPage("/wiki/List_of_weapons")
            const $ = this.loadHtml(html)

            // Thorium wiki uses simple tables
            $("table tr").each((_, row) => {
                const $row = $(row)

                // Skip header rows
                if ($row.find("th").length > 0) return

                // Thorium tables have structure: [Icon | Name | Damage | ... | Rarity | ...]
                const cells = $row.find("td")
                if (cells.length < 3) return

                // Second column usually contains the weapon name
                const nameCell = $(cells[1])
                const nameLink = nameCell.find("a").first()
                let name = normalizeItemName(nameLink.text())

                // If no link in second cell, try first cell
                if (!name) {
                    const firstCellLink = $(cells[0]).find("a").first()
                    name = normalizeItemName(firstCellLink.attr("title") || "")
                }

                if (!name || name.length < 3) return

                // Try to parse damage from third column
                const damageCell = $(cells[2])
                const damageText = damageCell.text().trim()
                const damage = this.parseDamage(damageText)

                // Parse weapon class from damage type column
                // Note: Thorium's List_of_weapons doesn't have class information in a separate column
                // The damage column shows numbers, not class names
                // We would need to scrape individual category pages or parse from icons/other indicators
                let weaponClass:
                    | "melee"
                    | "ranged"
                    | "magic"
                    | "summoner"
                    | "healer"
                    | "bard"
                    | "thrower"
                    | undefined
                // For now, leaving undefined - would need different scraping strategy to get classes

                items.push({
                    name,
                    type: "weapon",
                    rarity: 0,
                    damage,
                    weaponClass,
                })
            })

            console.log(`✅ Scraped ${items.length} Thorium weapons`)
        } catch (error) {
            console.error("Failed to scrape Thorium weapons:", error)
        }

        return items
    }

    async scrapeArmor(): Promise<ScrapedItem[]> {
        console.log("🛡️  Scraping Thorium armor...")
        const items: ScrapedItem[] = []

        try {
            await delay(1000)
            const html = await this.fetchPage("/wiki/Armor")
            const $ = this.loadHtml(html)

            // Thorium armor page uses tables with structure:
            // | Icon | Name | Head | Chest | Legs | Total | Set Bonus | Recipe |
            $("table tr").each((_, row) => {
                const $row = $(row)

                // Skip header rows
                if ($row.find("th").length > 0) return

                const cells = $row.find("td")
                if (cells.length < 6) return

                // Second column contains the armor set name
                const nameCell = $(cells[1])
                const nameLink = nameCell.find("a").first()
                let name = normalizeItemName(nameLink.text())

                // If no link, try getting text directly
                if (!name) {
                    name = normalizeItemName(nameCell.text())
                }

                if (!name || name.length < 3) return

                // Skip section headers and rows without "armor" in the name
                const lowerName = name.toLowerCase()
                if (
                    lowerName.includes("pre-hardmode") ||
                    lowerName.includes("hardmode") ||
                    lowerName.includes("thrower") ||
                    lowerName.includes("healer") ||
                    lowerName.includes("bard") ||
                    !lowerName.includes("armor") // Must contain "armor"
                ) {
                    return
                }

                // Parse defense values from columns 2, 3, 4 (head, chest, legs)
                const headDefense = parseInt($(cells[2]).text().trim()) || 0
                const chestDefense = parseInt($(cells[3]).text().trim()) || 0
                const legsDefense = parseInt($(cells[4]).text().trim()) || 0
                const defense = headDefense + chestDefense + legsDefense

                // The armor table shows complete sets, not individual pieces
                // We'll create individual pieces from the set data
                const baseName = name.replace(/\s*armor$/i, "").trim()

                // Add helmet
                items.push({
                    name: `${baseName} Headgear`,
                    type: "armor",
                    rarity: 0,
                    defense: headDefense,
                    armorType: "helmet",
                })

                // Add chestplate
                items.push({
                    name: `${baseName} Mail`,
                    type: "armor",
                    rarity: 0,
                    defense: chestDefense,
                    armorType: "chestplate",
                })

                // Add leggings
                items.push({
                    name: `${baseName} Greaves`,
                    type: "armor",
                    rarity: 0,
                    defense: legsDefense,
                    armorType: "leggings",
                })
            })

            console.log(`✅ Scraped ${items.length} Thorium armor pieces`)
        } catch (error) {
            console.error("Failed to scrape Thorium armor:", error)
        }

        return items
    }

    async scrapeAccessories(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered accessories
        return []
    }

    async scrapeBosses(): Promise<ScrapedBoss[]> {
        console.log("👹 Scraping Thorium bosses...")
        const bosses: ScrapedBoss[] = []

        try {
            // Thorium boss progression
            const preHardmode = [
                "The Grand Thunder Bird",
                "Queen Jellyfish",
                "Viscount",
                "Granite Energy Storm",
                "Buried Champion",
                "Star Scouter",
            ]

            const hardmode = [
                "Borean Strider",
                "Fallen Beholder",
                "Lich",
                "Forgotten One",
                "The Primordials",
            ]

            preHardmode.forEach((name) =>
                bosses.push({ name, progression: "pre-hardmode" })
            )
            hardmode.forEach((name) =>
                bosses.push({ name, progression: "hardmode" })
            )

            console.log(`✅ Scraped ${bosses.length} Thorium bosses`)
        } catch (error) {
            console.error("Failed to scrape Thorium bosses:", error)
        }

        return bosses
    }

    async scrapeBuffs(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered potions
        return []
    }

    async scrapeAmmunition(): Promise<ScrapedItem[]> {
        console.log("🏹 Scraping Thorium ammunition...")
        const items: ScrapedItem[] = []

        try {
            await delay(1000)
            const html = await this.fetchPage("/wiki/Ammunition")
            const $ = this.loadHtml(html)

            $("table tr").each((_, row) => {
                const $row = $(row)

                // Skip header rows
                if ($row.find("th").length > 0) return

                // Find item name - look for item-link span with anchor
                const nameLink = $row.find(".item-link a").first()
                const name = normalizeItemName(nameLink.attr("title") || "")

                if (!name) return

                const damage = this.parseDamage($row.text())
                const rarity = this.parseRarity($row.text())

                items.push({
                    name,
                    type: "ammunition",
                    rarity,
                    damage,
                })
            })

            console.log(`✅ Scraped ${items.length} Thorium ammunition`)
        } catch (error) {
            console.error("Failed to scrape Thorium ammunition:", error)
        }

        return items
    }
}
