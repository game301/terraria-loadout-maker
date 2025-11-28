/**
 * Universal Puppeteer Scraper for All Terraria Wikis
 *
 * Handles JavaScript-rendered collapsible sections for accessories and potions
 * across Vanilla, Calamity, and Thorium wikis with Cloudflare bypass
 */

import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { Browser, Page } from "puppeteer"

// Add stealth plugin to bypass Cloudflare
puppeteer.use(StealthPlugin())

export interface ScrapedItem {
    name: string
    type: "accessory" | "potion"
    rarity: number
    buff?: string
}

export async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function normalizeItemName(name: string): string {
    return name
        .replace(/\s+/g, " ")
        .replace(/[\[\]]/g, "")
        .replace(/^\s*-\s*/, "")
        .trim()
}

export function isValidItem(name: string): boolean {
    if (!name || name.length === 0) return false
    if (name.length > 80) return false
    if (name.length < 3) return false

    const lower = name.toLowerCase()

    // Filter wiki-specific terms
    if (lower.includes("template:")) return false
    if (lower.includes("template talk:")) return false
    if (lower.includes("file:")) return false
    if (lower.includes("category:")) return false

    // Filter UI/navigation text
    if (lower.includes("view the data")) return false
    if (lower.includes("click here")) return false
    if (lower.includes("tap here")) return false
    if (lower.includes("show data")) return false
    if (lower.includes("hide data")) return false
    if (lower === "click" || lower === "tap" || lower === "[") return false

    // Filter section headings
    if (
        lower === "armor" ||
        lower === "accessories" ||
        lower === "vanity items"
    )
        return false
    if (lower === "combat accessories" || lower === "movement") return false
    if (lower === "movement accessories" || lower === "fishing") return false
    if (lower === "informational" || lower === "health and mana") return false
    if (lower === "combat" || lower === "rings") return false
    if (lower === "buff potions" || lower === "developer items") return false
    if (lower === "dyes" || lower === "potions") return false
    if (
        lower === "pre-hardmode" ||
        lower === "hardmode" ||
        lower === "post-moonlord"
    )
        return false
    if (lower === "thrower" || lower === "healer" || lower === "bard")
        return false
    if (
        lower === "melee" ||
        lower === "ranged" ||
        lower === "magic" ||
        lower === "summoner"
    )
        return false

    // Filter potion category headings
    if (lower === "recovery potions" || lower === "flasks") return false
    if (lower === "other potions" || lower === "permanent power-ups")
        return false

    // Filter vanity/cosmetic sets (not actual accessories)
    if (lower.includes(" set") && !lower.includes("accessory")) return false
    if (lower.endsWith("'s set") || lower.endsWith(" set")) return false

    // Filter dyes (cosmetic only)
    if (lower.includes(" dye")) return false

    // Ignore armor pieces - these aren't accessories
    if (lower.includes(" armor") && !lower.includes("accessory")) return false
    if (
        lower.includes(" helmet") ||
        lower.includes(" breastplate") ||
        lower.includes(" leggings")
    )
        return false
    if (
        lower.includes(" headgear") ||
        lower.includes(" facemask") ||
        (lower.includes(" mask") && lower.length < 25)
    )
        return false

    return true
}

export class UniversalPuppeteerScraper {
    protected wikiBaseUrl: string
    protected modName: string
    protected idRangeStart: number
    protected currentId: number
    protected browser: Browser | null = null
    protected page: Page | null = null

    constructor(config: {
        wikiBaseUrl: string
        modName: string
        idRangeStart: number
    }) {
        this.wikiBaseUrl = config.wikiBaseUrl
        this.modName = config.modName
        this.idRangeStart = config.idRangeStart
        this.currentId = config.idRangeStart
    }

    async init(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process",
            ],
        })
        this.page = await this.browser.newPage()

        // Set realistic viewport and user agent
        await this.page.setViewport({ width: 1920, height: 1080 })
        await this.page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        // Set extra headers to look more like a real browser
        await this.page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        })
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close()
        }
    }

    async navigateToPage(path: string): Promise<void> {
        if (!this.page) {
            throw new Error("Browser not initialized. Call init() first.")
        }

        const url = `${this.wikiBaseUrl}${path}`
        console.log(`  Navigating to: ${url}`)

        try {
            const response = await this.page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 60000,
            })

            if (response && response.status() === 403) {
                console.log(
                    `  ⚠️ Cloudflare detected, retrying with longer delay...`
                )
                await delay(5000)
                await this.page.reload({ waitUntil: "networkidle2" })
            }
        } catch (error) {
            console.error(`  ❌ Failed to navigate to ${url}:`, error)
            throw error
        }
    }

    async scrapeAccessories(): Promise<ScrapedItem[]> {
        console.log(`💍 Scraping ${this.modName} accessories with Puppeteer...`)
        const items: ScrapedItem[] = []

        try {
            await this.navigateToPage("/wiki/Accessories")
            await delay(3000)

            // For Vanilla, attempt to populate AJAX placeholder tables by fetching their data-ajax sources
            if (this.modName === "vanilla") {
                console.log(
                    `  Attempting to populate AJAX tables for Vanilla wiki`
                )
                await delay(1500)

                // Fetch AJAX fragments for tables that have data-ajax attributes and replace them in-page
                try {
                    await this.page!.evaluate(async () => {
                        const tables = Array.from(
                            document.querySelectorAll("table.terraria.ajax")
                        )
                        for (const table of tables) {
                            try {
                                const srcAttr =
                                    table.getAttribute("data-ajax-source") ||
                                    table.getAttribute(
                                        "data-ajax-source-page"
                                    ) ||
                                    table.getAttribute("data-ajax-source-url")
                                if (!srcAttr) continue

                                let src = srcAttr
                                // Normalize to absolute URL when necessary
                                if (!/^https?:\/\//i.test(src)) {
                                    if (src.startsWith("/"))
                                        src = location.origin + src
                                    else if (
                                        src.startsWith("index.php") ||
                                        src.startsWith("?")
                                    )
                                        src = location.origin + "/" + src
                                    else if (!src.startsWith("http"))
                                        src = location.origin + "/wiki/" + src
                                }

                                try {
                                    const resp = await fetch(src, {
                                        credentials: "same-origin",
                                    })
                                    if (!resp.ok) continue
                                    const html = await resp.text()

                                    // Insert returned fragment into the DOM: prefer replacing the whole table if fragment contains one
                                    const wrapper =
                                        document.createElement("div")
                                    wrapper.innerHTML = html
                                    const innerTable =
                                        wrapper.querySelector("table")
                                    if (innerTable) {
                                        table.replaceWith(innerTable)
                                    } else {
                                        const tbody =
                                            wrapper.querySelector("tbody")
                                        if (tbody) {
                                            const existingTbody =
                                                table.querySelector("tbody")
                                            if (existingTbody)
                                                existingTbody.remove()
                                            table.appendChild(tbody)
                                        }
                                    }
                                } catch (e) {
                                    // ignore per-table fetch errors
                                }
                            } catch (e) {
                                // ignore errors for this table
                            }
                        }
                    })

                    // small delay for DOM updates
                    await delay(1500)
                    console.log(`  AJAX table population attempt finished`)
                } catch (err) {
                    console.log(
                        `  Error while attempting to populate AJAX tables:`,
                        err
                    )
                }

                // Extract from visible tables with class "terraria"
                const result = await this.page!.evaluate(() => {
                    const names: string[] = []
                    const debugInfo: string[] = []

                    // Find all tables - try multiple selectors
                    const tables = document.querySelectorAll("table")
                    debugInfo.push(`Found ${tables.length} total tables`)

                    tables.forEach((table, idx) => {
                        // Check if this table has the right structure
                        const rows = table.querySelectorAll("tr")
                        if (rows.length < 2) return // Skip tables with no data rows

                        // Check if table has class "terraria" or similar
                        const hasRelevantClass =
                            table.classList.contains("terraria") ||
                            table.classList.contains("lined") ||
                            table.classList.contains("sortable")

                        if (!hasRelevantClass) return

                        debugInfo.push(
                            `Table ${idx}: ${rows.length} rows, classes: ${table.className}`
                        )

                        let foundInThisTable = 0

                        rows.forEach((row, rowIdx) => {
                            // Skip header rows
                            const ths = row.querySelectorAll("th")
                            if (ths.length > 0) return

                            const cells = row.querySelectorAll("td")
                            if (cells.length === 0) return

                            if (rowIdx < 3) {
                                debugInfo.push(
                                    `  Row ${rowIdx}: ${cells.length} cells`
                                )
                            }

                            // First column typically contains the accessory name
                            const firstCell = cells[0]

                            // Look for links with title attribute (preferred)
                            const linkWithTitle =
                                firstCell.querySelector("a[title]")
                            if (linkWithTitle) {
                                const title =
                                    linkWithTitle.getAttribute("title")
                                if (rowIdx < 3) {
                                    debugInfo.push(`    Link title: "${title}"`)
                                }
                                if (
                                    title &&
                                    title.length > 3 &&
                                    !title.toLowerCase().includes("click") &&
                                    !title.toLowerCase().includes("tap")
                                ) {
                                    names.push(title)
                                    foundInThisTable++
                                    return
                                }
                            }

                            // Fallback: get text from first link
                            const anyLink = firstCell.querySelector("a[href]")
                            if (
                                anyLink &&
                                anyLink.getAttribute("href")?.includes("/wiki/")
                            ) {
                                const text = anyLink.textContent?.trim() || ""
                                if (rowIdx < 3) {
                                    debugInfo.push(`    Link text: "${text}"`)
                                }
                                if (
                                    text &&
                                    text.length > 3 &&
                                    !text.toLowerCase().includes("click") &&
                                    !text.toLowerCase().includes("tap")
                                ) {
                                    names.push(text)
                                    foundInThisTable++
                                }
                            }
                        })

                        if (foundInThisTable > 0) {
                            debugInfo.push(
                                `  Table ${idx}: found ${foundInThisTable} items`
                            )
                        }
                    })

                    return { names, debugInfo }
                })

                console.log(`  Debug info from page:`)
                result.debugInfo.forEach((line) => console.log(`    ${line}`))

                const accessoryNames = result.names
                console.log(
                    `  Found ${accessoryNames.length} potential Vanilla accessories`
                )

                // Process the names
                const seen = new Set<string>()
                const filtered: Array<{ name: string; reason: string }> = []

                for (const name of accessoryNames) {
                    const normalized = normalizeItemName(name)

                    if (!normalized || normalized.length < 3) {
                        filtered.push({ name, reason: "too short or empty" })
                        continue
                    }

                    if (!isValidItem(normalized)) {
                        filtered.push({ name, reason: "failed isValidItem()" })
                        continue
                    }

                    if (seen.has(normalized)) {
                        filtered.push({ name, reason: "duplicate" })
                        continue
                    }

                    seen.add(normalized)

                    items.push({
                        name: normalized,
                        type: "accessory",
                        rarity: 0,
                    })
                }

                if (filtered.length > 0) {
                    console.log(`  Filtered out ${filtered.length} items:`)
                    filtered
                        .slice(0, 10)
                        .forEach((f) =>
                            console.log(`    - "${f.name}" (${f.reason})`)
                        )
                    if (filtered.length > 10) {
                        console.log(`    ... and ${filtered.length - 10} more`)
                    }
                }

                console.log(
                    `✅ Scraped ${items.length} ${this.modName} accessories`
                )
                return items
            }

            // For Calamity and Thorium, use the collapsible clicking approach

            // Count and click all collapsible sections
            const clickedCount = await this.page!.evaluate(() => {
                let clicked = 0
                document
                    .querySelectorAll(
                        ".mw-collapsible.mw-collapsed .mw-collapsible-toggle"
                    )
                    .forEach((toggle) => {
                        if (toggle instanceof HTMLElement) {
                            toggle.click()
                            clicked++
                        }
                    })
                return clicked
            })

            console.log(`  Clicked ${clickedCount} toggles`)

            // Wait for the collapsed class to be removed (indicating expansion)
            if (clickedCount > 0) {
                console.log(`  Waiting for sections to expand...`)
                await this.page!.waitForFunction(
                    () =>
                        document.querySelectorAll(
                            ".mw-collapsible.mw-collapsed"
                        ).length === 0,
                    { timeout: 30000 }
                ).catch(() => {
                    console.log(`  ⚠️ Some sections may not have expanded`)
                })

                // Extra delay for content to fully load (longer for Vanilla)
                const extraDelay = this.modName === "vanilla" ? 10000 : 5000
                await delay(extraDelay)

                // For Vanilla, wait for item links to appear
                if (this.modName === "vanilla") {
                    console.log(`  Waiting for Vanilla item links to load...`)
                    await this.page!.waitForFunction(
                        () =>
                            document.querySelectorAll('table a[href*="/wiki/"]')
                                .length > 50,
                        { timeout: 15000 }
                    ).catch(() => {
                        console.log(`  ⚠️ Vanilla links may not have loaded`)
                    })
                    await delay(3000)
                }
            }

            // Check if tables loaded
            const tableInfo = await this.page!.evaluate(() => {
                const allTables = document.querySelectorAll("table")
                const tablesWithRows = Array.from(allTables).filter(
                    (t) => t.querySelectorAll("tr").length > 1
                ).length
                return {
                    total: allTables.length,
                    withRows: tablesWithRows,
                }
            })
            console.log(
                `  Found ${tableInfo.total} tables (${tableInfo.withRows} with data rows)`
            )

            // Extract accessory names from expanded tables
            const accessoryNames = await this.page!.evaluate(() => {
                const names: string[] = []

                // Find all tables - after clicking, tables appear with accessory data
                const tables = document.querySelectorAll("table")

                tables.forEach((table) => {
                    // Get all rows
                    const rows = table.querySelectorAll("tr")

                    rows.forEach((row) => {
                        // Get all cells in this row
                        const cells = Array.from(row.querySelectorAll("td, th"))
                        if (cells.length === 0) return

                        // Look for links in ANY cell
                        cells.forEach((cell) => {
                            // Try both a[title] and regular a tags
                            const links = cell.querySelectorAll("a")
                            links.forEach((link) => {
                                const title =
                                    link.getAttribute("title") ||
                                    link.textContent?.trim() ||
                                    ""
                                if (title) {
                                    names.push(title)
                                }
                            })
                        })
                    })
                })

                return names
            })

            console.log(`  Found ${accessoryNames.length} raw accessory names`)

            // Deduplicate and validate
            const seen = new Set<string>()
            const filtered: string[] = []
            for (const name of accessoryNames) {
                const normalized = normalizeItemName(name)
                if (!isValidItem(normalized)) {
                    filtered.push(`"${name}" -> invalid`)
                    continue
                }
                if (seen.has(normalized)) {
                    filtered.push(`"${name}" -> duplicate`)
                    continue
                }
                seen.add(normalized)

                items.push({
                    name: normalized,
                    type: "accessory",
                    rarity: 0,
                })
            }

            if (filtered.length > 0) {
                console.log(`  Filtered out ${filtered.length} items:`)
                filtered.slice(0, 10).forEach((f) => console.log(`    - ${f}`))
                if (filtered.length > 10) {
                    console.log(`    ... and ${filtered.length - 10} more`)
                }
            }

            console.log(
                `✅ Scraped ${items.length} ${this.modName} accessories`
            )
        } catch (error) {
            console.error(
                `Failed to scrape ${this.modName} accessories:`,
                error
            )
        }

        return items
    }

    async scrapeBuffs(): Promise<ScrapedItem[]> {
        console.log(
            `🧪 Scraping ${this.modName} buffs/potions with Puppeteer...`
        )
        const items: ScrapedItem[] = []

        try {
            await this.navigateToPage("/wiki/Potions")
            await delay(3000)

            // For Vanilla, we need to expand collapsible sections first
            if (this.modName === "vanilla") {
                console.log(
                    `  Expanding collapsible sections for Vanilla potions`
                )
                await delay(2000)

                // Click all [show] / [hide] toggles
                const clickedCount = await this.page!.evaluate(() => {
                    let clicked = 0

                    const allLinks = document.querySelectorAll(
                        "a, span.mw-collapsible-toggle"
                    )
                    allLinks.forEach((el) => {
                        const text = el.textContent?.trim() || ""
                        if (
                            text === "[show]" ||
                            text === "[expand]" ||
                            text.toLowerCase().includes("show")
                        ) {
                            if (el instanceof HTMLElement && el.onclick) {
                                el.click()
                                clicked++
                            }
                        }
                    })

                    document
                        .querySelectorAll(".mw-collapsible-toggle-default")
                        .forEach((toggle) => {
                            if (toggle instanceof HTMLElement) {
                                toggle.click()
                                clicked++
                            }
                        })

                    return clicked
                })

                console.log(`  Clicked ${clickedCount} toggle elements`)
                await delay(2000)

                // Attempt to populate any AJAX placeholder tables (Vanilla uses ajax fragments)
                try {
                    await this.page!.evaluate(async () => {
                        const tables = Array.from(
                            document.querySelectorAll("table.terraria.ajax")
                        )
                        for (const table of tables) {
                            try {
                                const srcAttr =
                                    table.getAttribute("data-ajax-source") ||
                                    table.getAttribute(
                                        "data-ajax-source-page"
                                    ) ||
                                    table.getAttribute("data-ajax-source-url")
                                if (!srcAttr) continue
                                let src = srcAttr
                                if (!/^https?:\/\//i.test(src)) {
                                    if (src.startsWith("/"))
                                        src = location.origin + src
                                    else if (
                                        src.startsWith("index.php") ||
                                        src.startsWith("?")
                                    )
                                        src = location.origin + "/" + src
                                    else if (!src.startsWith("http"))
                                        src = location.origin + "/wiki/" + src
                                }
                                try {
                                    const resp = await fetch(src, {
                                        credentials: "same-origin",
                                    })
                                    if (!resp.ok) continue
                                    const html = await resp.text()
                                    const wrapper =
                                        document.createElement("div")
                                    wrapper.innerHTML = html
                                    const innerTable =
                                        wrapper.querySelector("table")
                                    if (innerTable)
                                        table.replaceWith(innerTable)
                                    else {
                                        const tbody =
                                            wrapper.querySelector("tbody")
                                        if (tbody) {
                                            const existingTbody =
                                                table.querySelector("tbody")
                                            if (existingTbody)
                                                existingTbody.remove()
                                            table.appendChild(tbody)
                                        }
                                    }
                                } catch (e) {
                                    // ignore per-table errors
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    })
                    await delay(1200)
                    console.log(
                        "  AJAX fragment fetch attempt completed for Potions"
                    )
                } catch (e) {
                    console.log(
                        "  Error fetching AJAX fragments for Potions:",
                        e
                    )
                }

                // Extract directly from visible tables
                const potionNames = await this.page!.evaluate(() => {
                    const names: string[] = []

                    // Find all tables with class "terraria"
                    const tables = document.querySelectorAll(
                        "table.terraria, table.lined, table.sortable"
                    )

                    tables.forEach((table) => {
                        const rows = table.querySelectorAll("tr")
                        rows.forEach((row) => {
                            // Skip header rows
                            if (row.querySelector("th")) return

                            const cells = row.querySelectorAll("td")
                            if (cells.length === 0) return

                            // First column contains potion name and icon
                            const firstCell = cells[0]

                            // Look for link with title
                            const linkWithTitle =
                                firstCell.querySelector("a[title]")
                            if (linkWithTitle) {
                                const title =
                                    linkWithTitle.getAttribute("title")
                                if (
                                    title &&
                                    title.length > 0 &&
                                    !title.toLowerCase().includes("click") &&
                                    (title.toLowerCase().includes("potion") ||
                                        title.toLowerCase().includes("flask") ||
                                        title
                                            .toLowerCase()
                                            .includes("elixir") ||
                                        title.toLowerCase().includes("ale"))
                                ) {
                                    names.push(title)
                                    return
                                }
                            }

                            // Fallback: check link text
                            const anyLink = firstCell.querySelector("a")
                            if (anyLink) {
                                const text = anyLink.textContent?.trim() || ""
                                if (
                                    text &&
                                    text.length > 0 &&
                                    !text.toLowerCase().includes("click") &&
                                    (text.toLowerCase().includes("potion") ||
                                        text.toLowerCase().includes("flask") ||
                                        text.toLowerCase().includes("elixir") ||
                                        text.toLowerCase().includes("ale"))
                                ) {
                                    names.push(text)
                                }
                            }
                        })
                    })

                    return names
                })

                console.log(
                    `  Found ${potionNames.length} potential Vanilla potions`
                )

                // Process names
                const seen = new Set<string>()
                for (const name of potionNames) {
                    const normalized = normalizeItemName(name)
                    if (!isValidItem(normalized)) continue
                    if (seen.has(normalized)) continue
                    seen.add(normalized)

                    const buffName = normalized.replace(
                        / (Potion|Flask|Elixir|Ale)$/i,
                        ""
                    )
                    items.push({
                        name: normalized,
                        type: "potion",
                        rarity: 0,
                        buff: buffName,
                    })
                }

                console.log(
                    `✅ Scraped ${items.length} ${this.modName} buffs/potions`
                )
                return items
            }

            // Count and click all collapsible sections
            const clickedCount = await this.page!.evaluate((modName) => {
                let clicked = 0

                // For Vanilla, try clicking visible toggle links/buttons
                if (modName === "vanilla") {
                    // Try finding toggle buttons by text content
                    const allLinks = document.querySelectorAll(
                        'a, span[role="button"], .mw-collapsible-toggle'
                    )
                    allLinks.forEach((el) => {
                        const text = el.textContent?.toLowerCase() || ""
                        if (
                            text.includes("show") ||
                            text.includes("expand") ||
                            (text.includes("[") && text.includes("]"))
                        ) {
                            if (el instanceof HTMLElement) {
                                el.click()
                                clicked++
                            }
                        }
                    })
                } else {
                    // For Calamity and Thorium, use the standard selector
                    document
                        .querySelectorAll(
                            ".mw-collapsible.mw-collapsed .mw-collapsible-toggle"
                        )
                        .forEach((toggle) => {
                            if (toggle instanceof HTMLElement) {
                                toggle.click()
                                clicked++
                            }
                        })
                }
                return clicked
            }, this.modName)

            console.log(`  Clicked ${clickedCount} toggles`)

            // Wait for the collapsed class to be removed (indicating expansion)
            if (clickedCount > 0) {
                console.log(`  Waiting for sections to expand...`)

                if (this.modName === "vanilla") {
                    // For Vanilla, just wait for content to load
                    await delay(12000)
                    console.log(`  Waiting for Vanilla table content...`)
                    await this.page!.waitForFunction(
                        () => {
                            const tables = document.querySelectorAll("table")
                            let linkCount = 0
                            tables.forEach((t) => {
                                linkCount +=
                                    t.querySelectorAll(
                                        'a[href*="/wiki/"]'
                                    ).length
                            })
                            return linkCount > 30
                        },
                        { timeout: 20000 }
                    ).catch(() => {
                        console.log(
                            `  ⚠️ Vanilla table links may not have loaded`
                        )
                    })
                    await delay(3000)
                } else {
                    // For mod wikis, use standard wait
                    await this.page!.waitForFunction(
                        () =>
                            document.querySelectorAll(
                                ".mw-collapsible.mw-collapsed"
                            ).length === 0,
                        { timeout: 30000 }
                    ).catch(() => {
                        console.log(`  ⚠️ Some sections may not have expanded`)
                    })
                    await delay(5000)
                }
            }

            // Check if tables loaded
            const tableInfo = await this.page!.evaluate(() => {
                const allTables = document.querySelectorAll("table")
                const tablesWithRows = Array.from(allTables).filter(
                    (t) => t.querySelectorAll("tr").length > 1
                ).length
                return {
                    total: allTables.length,
                    withRows: tablesWithRows,
                }
            })
            console.log(
                `  Found ${tableInfo.total} tables (${tableInfo.withRows} with data rows)`
            )

            // Extract potion names from expanded tables
            const potionNames = await this.page!.evaluate(() => {
                const names: string[] = []

                const tables = document.querySelectorAll("table")

                tables.forEach((table) => {
                    const rows = table.querySelectorAll("tr")

                    rows.forEach((row) => {
                        const cells = Array.from(row.querySelectorAll("td, th"))
                        if (cells.length === 0) return

                        cells.forEach((cell) => {
                            // Try both a[title] and regular a tags
                            const links = cell.querySelectorAll("a")
                            links.forEach((link) => {
                                const title =
                                    link.getAttribute("title") ||
                                    link.textContent?.trim() ||
                                    ""
                                if (
                                    title &&
                                    (title.toLowerCase().includes("potion") ||
                                        title.toLowerCase().includes("flask") ||
                                        title.toLowerCase().includes("elixir"))
                                ) {
                                    names.push(title)
                                }
                            })
                        })
                    })
                })

                return names
            })

            console.log(`  Found ${potionNames.length} raw potion names`)

            // Deduplicate and validate
            const seen = new Set<string>()
            for (const name of potionNames) {
                const normalized = normalizeItemName(name)
                if (!isValidItem(normalized)) continue
                if (seen.has(normalized)) continue
                seen.add(normalized)

                items.push({
                    name: normalized,
                    type: "potion",
                    rarity: 0,
                    buff: normalized
                        .replace(" Potion", "")
                        .replace(" Flask", "")
                        .replace(" Elixir", ""),
                })
            }

            console.log(
                `✅ Scraped ${items.length} ${this.modName} buffs/potions`
            )
        } catch (error) {
            console.error(`Failed to scrape ${this.modName} buffs:`, error)
        }

        return items
    }

    protected getNextId(): number {
        return this.currentId++
    }

    async scrapeAll(): Promise<{
        accessories: ScrapedItem[]
        buffs: ScrapedItem[]
    }> {
        await this.init()

        const accessories = await this.scrapeAccessories()
        const buffs = await this.scrapeBuffs()

        await this.close()

        return { accessories, buffs }
    }
}
