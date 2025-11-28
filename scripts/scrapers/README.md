# Wiki Scrapers

This directory contains modular wiki scrapers for extracting Terraria item and boss data from various wikis.

## Architecture

-   **`base-scraper.ts`** - Abstract base class with common scraping functionality
-   **`vanilla-scraper.ts`** - Scrapes official Terraria Wiki (terraria.wiki.gg)
-   **`calamity-scraper.ts`** - Scrapes Calamity Mod Wiki (calamitymod.wiki.gg)
-   **`thorium-scraper.ts`** - Scrapes Thorium Mod Wiki (thoriummod.wiki.gg)

## Usage

Run the main scraping script:

```bash
pnpm scrape-wikis
```

This will:

1. Scrape all configured wikis (Vanilla, Calamity, Thorium)
2. Generate JSON files with `-scraped` suffix in the `data/` directory
3. Preserve your existing data files

## Output Files

The scraper generates these files in the `data/` directory:

-   `items-vanilla-scraped.json`
-   `bosses-vanilla-scraped.json`
-   `buffs-vanilla-scraped.json`
-   `items-calamity-scraped.json`
-   `bosses-calamity-scraped.json`
-   `buffs-calamity-scraped.json`
-   `items-thorium-scraped.json`
-   `bosses-thorium-scraped.json`
-   `buffs-thorium-scraped.json`

## Adding New Mod Scrapers

To add a new mod (e.g., "Fargo's Mods"):

1. Create `scripts/scrapers/fargos-scraper.ts`:

```typescript
import { BaseWikiScraper, ScrapedItem, ScrapedBoss } from "./base-scraper"

export class FargosScraper extends BaseWikiScraper {
    constructor() {
        super({
            wikiBaseUrl: "https://fargosmod.wiki.gg", // Replace with actual URL
            modName: "fargos",
            idRangeStart: 300000, // Use next available range
        })
    }

    // Implement abstract methods:
    async scrapeWeapons(): Promise<ScrapedItem[]> {
        /* ... */
    }
    async scrapeArmor(): Promise<ScrapedItem[]> {
        /* ... */
    }
    async scrapeAccessories(): Promise<ScrapedItem[]> {
        /* ... */
    }
    async scrapeBosses(): Promise<ScrapedBoss[]> {
        /* ... */
    }
    async scrapeBuffs(): Promise<ScrapedItem[]> {
        /* ... */
    }
}
```

2. Import and use in `scrape-all-wikis.ts`:

```typescript
import { FargosScraper } from "./scrapers/fargos-scraper"

async function scrapeFargos() {
    const scraper = new FargosScraper()
    // ... scrape and save
}

// Add to main():
await scrapeFargos()
```

## Important Notes

⚠️ **Rate Limiting**: The scraper includes 1-second delays between requests to be respectful to wiki servers.

⚠️ **Wiki Structure Changes**: Scrapers may break if wikis change their HTML structure. You'll need to update the parsing logic.

⚠️ **Manual Review**: Always review scraped data before using it in production. The scraper makes best-effort attempts at parsing but may have inaccuracies.

⚠️ **ID Ranges**: Follow the ID allocation in `DATA_STRUCTURE.md`:

-   Vanilla: 1 - 99,999
-   Calamity: 100,000 - 199,999
-   Thorium: 200,000 - 299,999
-   Future mods: 300,000+

## Dependencies

-   `cheerio` - For HTML parsing (jQuery-like API)
-   `tsx` - For running TypeScript directly

## Troubleshooting

**Problem**: Scraper returns empty results

-   **Solution**: Check if the wiki URL is correct and accessible
-   **Solution**: Inspect the wiki's HTML structure (it may have changed)

**Problem**: "403 Forbidden" or "429 Too Many Requests"

-   **Solution**: Increase the delay between requests
-   **Solution**: Check if the wiki has rate limiting or requires authentication

**Problem**: Items have incorrect data

-   **Solution**: Update the parsing logic for that specific wiki's table structure
-   **Solution**: Manually verify against the wiki and adjust regex patterns
