/**
 * Calamity Mod Wiki Scraper
 *
 * Scrapes items from the Calamity Mod Wiki (calamitymod.wiki.gg)
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

export class CalamityScraper extends BaseWikiScraper {
    constructor() {
        super({
            wikiBaseUrl: "https://calamitymod.wiki.gg",
            modName: "calamity",
            idRangeStart: 100000,
        })
    }

    async scrapeWeapons(): Promise<ScrapedItem[]> {
        console.log("🔥 Scraping Calamity weapons...")
        const items: ScrapedItem[] = []

        try {
            // Calamity doesn't have boost gear sections, so individual category pages are fine
            const weaponCategories = [
                "/wiki/Melee_weapons",
                "/wiki/Ranged_weapons",
                "/wiki/Magic_weapons",
                "/wiki/Summon_weapons",
                "/wiki/Rogue_weapons",
            ]

            for (const page of weaponCategories) {
                await delay(1000)
                const html = await this.fetchPage(page)
                const $ = this.loadHtml(html)

                $("table.terraria.sortable tr").each((_, row) => {
                    const $row = $(row)

                    // Skip header rows
                    if ($row.find("th").length > 0) return

                    // Find the item name - it's usually in the second TD
                    const nameTd = $row.find("td").eq(1)
                    let nameLink = nameTd.find("a").first()
                    const name = normalizeItemName(nameLink.text())

                    if (!name) return

                    const damage = this.parseDamage($row.text())
                    const weaponClass = this.parseWeaponClass(page)
                    const rarityText = $row.text()
                    const rarity = this.parseRarity(rarityText)

                    items.push({
                        name,
                        type: "weapon",
                        rarity,
                        damage,
                        weaponClass,
                    })
                })
            }

            console.log(`✅ Scraped ${items.length} Calamity weapons`)
        } catch (error) {
            console.error("Failed to scrape Calamity weapons:", error)
        }

        return items
    }

    async scrapeArmor(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered armor from Guide:Armor_progression
        return []
    }

    async scrapeAccessories(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered accessories
        return []
    }

    async scrapeBosses(): Promise<ScrapedBoss[]> {
        console.log("👹 Scraping Calamity bosses...")
        const bosses: ScrapedBoss[] = []

        try {
            // Calamity has well-defined boss progression
            const preHardmode = [
                "Desert Scourge",
                "Crabulon",
                "The Hive Mind",
                "The Perforators",
                "The Slime God",
            ]

            const hardmode = [
                "Cryogen",
                "Aquatic Scourge",
                "Brimstone Elemental",
                "Calamitas Clone",
                "Leviathan and Anahita",
                "Astrum Aureus",
                "The Plaguebringer Goliath",
                "Ravager",
                "Astrum Deus",
            ]

            const postMoonLord = [
                "Profaned Guardians",
                "Dragonfolly",
                "Providence, the Profaned Goddess",
                "Storm Weaver",
                "Ceaseless Void",
                "Signus, Envoy of the Devourer",
                "Polterghast",
                "The Old Duke",
                "The Devourer of Gods",
                "Yharon, Dragon of Rebirth",
                "Exo Mechs",
                "Supreme Witch, Calamitas",
            ]

            preHardmode.forEach((name) =>
                bosses.push({ name, progression: "pre-hardmode" })
            )
            hardmode.forEach((name) =>
                bosses.push({ name, progression: "hardmode" })
            )
            postMoonLord.forEach((name) =>
                bosses.push({ name, progression: "post-moonlord" })
            )

            console.log(`✅ Scraped ${bosses.length} Calamity bosses`)
        } catch (error) {
            console.error("Failed to scrape Calamity bosses:", error)
        }

        return bosses
    }

    async scrapeBuffs(): Promise<ScrapedItem[]> {
        // Skipped - Puppeteer scraper handles JS-rendered potions
        return []
    }

    async scrapeAmmunition(): Promise<ScrapedItem[]> {
        console.log("🏹 Scraping Calamity ammunition...")
        const items: ScrapedItem[] = []

        try {
            const ammoPages = ["/wiki/Arrows", "/wiki/Bullets"]

            for (const page of ammoPages) {
                await delay(1000)
                const html = await this.fetchPage(page)
                const $ = this.loadHtml(html)

                $("table.terraria.sortable tr").each((_, row) => {
                    const $row = $(row)

                    // Skip header rows
                    if ($row.find("th").length > 0) return

                    // Find item name in second TD
                    const nameTd = $row.find("td").eq(1)
                    const nameLink = nameTd.find("a").first()
                    const name = normalizeItemName(nameLink.text())

                    if (!name || name.includes("Endless")) return

                    const damageText = $row.find("td").eq(2).text()
                    const damage = this.parseDamage(damageText)
                    const rarityText = $row.text()
                    const rarity = this.parseRarity(rarityText)

                    items.push({
                        name,
                        type: "ammunition",
                        rarity,
                        damage,
                    })
                })
            }

            console.log(`✅ Scraped ${items.length} Calamity ammunition`)
        } catch (error) {
            console.error("Failed to scrape Calamity ammunition:", error)
        }

        return items
    }
}
