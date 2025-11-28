# Wiki Scraper Guide

**Last Updated:** January 2025

This guide explains the dual-scraper architecture for extracting Terraria item data from wikis.

## Scraper Architecture

The project uses **two complementary scraping systems**:

### 1. Cheerio Scraper (Static HTML)

**Purpose:** Fast extraction of weapons, armor, ammunition, and bosses from wiki HTML tables

**Technology:** Cheerio (jQuery-like HTML parsing)

**Command:**

```bash
pnpm scrape:all  # Scrape all three wikis
```

**What it scrapes:**

-   ✅ Weapons (all categories: swords, bows, guns, magic, summoner, etc.)
-   ✅ Armor sets (helmets, chestplates, leggings)
-   ✅ Ammunition (arrows, bullets, rockets)
-   ✅ Bosses (with progression order)

**What it CANNOT scrape:**

-   ❌ Accessories (in JavaScript-collapsed sections)
-   ❌ Buffs/Potions (in JavaScript-collapsed sections)
-   ❌ Thorium weapons (uses icon grid layout, not HTML tables - see Known Issues)

**Output files:**

-   `items-{mod}-scraped.json` (weapons + armor)
-   `ammunition-{mod}-scraped.json` (ammunition)
-   `bosses-{mod}-scraped.json` (bosses with order field)

**Current results:**

-   **Vanilla:** ✅ 564 weapons, 410 armor pieces, 49 ammunition, 18 bosses
-   **Calamity:** ✅ 752 weapons, 205 armor pieces (via Puppeteer), 19 ammunition, 26 bosses
-   **Thorium:** ✅ 714 weapons, 198 armor pieces, 28 ammunition, 11 bosses

**Note:** Calamity armor is scraped via Puppeteer due to JavaScript-collapsed sections on the armor progression page.

### 2. Puppeteer Scraper (JavaScript-Rendered)

**Purpose:** Extract accessories and buffs/potions from JavaScript-collapsed wiki sections

**Technology:** Puppeteer + puppeteer-extra (Cloudflare bypass)

**Command:**

```bash
pnpm scrape:js  # Scrape JavaScript sections for all mods
```

**What it scrapes:**

-   ✅ Accessories (from `.mw-collapsible` sections)
-   ✅ Buffs/Potions (from `.mw-collapsible` sections)

**What it CANNOT scrape:**

-   ❌ Vanilla wiki accessories/potions (different JavaScript structure - see Known Issues)
-   ❌ Static HTML content (use Cheerio scraper instead)

**Output files:**

-   `items-{mod}-accessories-js-puppeteer.json`
-   `buffs-{mod}-js-puppeteer.json`

**Current results:**

-   **Vanilla:** ✅ 377 accessories, 56 buffs
-   **Calamity:** ✅ 217 accessories, 205 armor pieces, 18 buffs
-   **Thorium:** ✅ 264 accessories, 16 buffs

**Why Puppeteer?**

Mod wikis hide accessories and potions in collapsed sections:

```html
<div class="mw-collapsible mw-collapsed">
    <div class="mw-collapsible-toggle">Click/tap here to reveal</div>
    <div class="mw-collapsible-content">
        <!-- Actual item table here -->
    </div>
</div>
```

Cheerio sees only "Click/tap here to reveal" text. Puppeteer simulates clicks to reveal content.

**Cloudflare Protection:**

Wikis use Cloudflare to block bots. Solution:

-   `puppeteer-extra-plugin-stealth` - Mimics real browser
-   Realistic user agent
-   Headless mode with stealth fingerprinting

## Complete Scraping Workflow

To get **all** item data for all mods:

```bash
# Step 1: Scrape static content (weapons, armor, ammo, bosses)
pnpm scrape:all

# Step 2: Scrape JavaScript content (accessories, buffs)
pnpm scrape:js

# Result: 9 generated files
# Cheerio output (3 sets of 3 files):
#   - items-vanilla-scraped.json (weapons + armor)
#   - ammo-vanilla-scraped.json (ammunition)
#   - bosses-vanilla-scraped.json (bosses)
#   - items-calamity-scraped.json
#   - ammo-calamity-scraped.json
#   - bosses-calamity-scraped.json
#   - items-thorium-scraped.json
#   - ammo-thorium-scraped.json
#   - bosses-thorium-scraped.json
#
# Puppeteer output (2 sets of 2 files):
#   - items-calamity-accessories-js-puppeteer.json
#   - buffs-calamity-js-puppeteer.json
#   - items-thorium-accessories-js-puppeteer.json
#   - buffs-thorium-js-puppeteer.json
```

## File Organization

### Scraped Data Files

All scraped files use suffixes to indicate scraping method:

**Cheerio scraped (`-scraped`):**

-   `items-vanilla-scraped.json` - 487 items (weapons + armor)
-   `ammo-vanilla-scraped.json` - 48 items
-   `bosses-vanilla-scraped.json` - 18 bosses
-   (Same pattern for calamity/thorium)

**Puppeteer scraped (`-js-puppeteer` or `-accessories-js-puppeteer`):**

-   `items-calamity-accessories-js-puppeteer.json` - 217 accessories
-   `buffs-calamity-js-puppeteer.json` - 18 potions
-   (Same pattern for thorium)

**Production files (no suffix):**

-   `items-vanilla.json` - Curated/verified items
-   `bosses-vanilla.json` - Curated/verified bosses
-   (These are what the app imports)

### Data Flow

```
Wiki Pages
    ↓
[Cheerio Scraper] → items-{mod}-scraped.json
    ↓                ammunition-{mod}-scraped.json
[Review]            bosses-{mod}-scraped.json
    ↓
[Merge/Replace]
    ↓
items-{mod}.json ← App imports this
ammunition-{mod}.json
bosses-{mod}.json

Wiki Pages (collapsed sections)
    ↓
[Puppeteer Scraper] → items-{mod}-accessories-js-puppeteer.json
    ↓                   buffs-{mod}-js-puppeteer.json
[Review]
    ↓
[Merge/Replace]
    ↓
items-{mod}.json ← App imports this (combined with scraped items)
buffs-{mod}.json
```

## Using Scraped Data

### Option 1: Replace Entire Files (Fast)

```bash
# After scraping, directly replace production files
pnpm scrape:all
mv data/items-calamity-scraped.json data/items-calamity.json
mv data/bosses-calamity-scraped.json data/bosses-calamity.json
mv data/ammunition-calamity-scraped.json data/ammunition-calamity.json

pnpm scrape:js
mv data/items-calamity-accessories-js-puppeteer.json data/items-calamity-accessories.json
mv data/buffs-calamity-js-puppeteer.json data/buffs-calamity.json
```

**Pros:**

-   Instant comprehensive update
-   All wiki items included
-   No manual work

**Cons:**

-   May include irrelevant items
-   No curation
-   Potential quality issues

### Option 2: Selective Merge (Curated)

```bash
# After scraping, manually review and merge items
pnpm scrape:all && pnpm scrape:js

# Open scraped files in editor
code data/items-calamity-scraped.json
code data/items-calamity-accessories-js-puppeteer.json

# Copy desired items into production files
# items-calamity.json, items-calamity-accessories.json

# Delete scraped files after merging
rm data/*-scraped.json
rm data/*-js-puppeteer.json
```

**Pros:**

-   Quality control
-   Only relevant items
-   Curated experience

**Cons:**

-   Manual work required
-   Time-consuming for large datasets
-   May miss useful items

### Option 3: Hybrid Approach (Recommended)

```bash
# Use scraped data as-is for comprehensive coverage
pnpm scrape:all && pnpm scrape:js

# Rename to production (keep -scraped suffix for now)
# App can import from -scraped files temporarily

# In code, update imports:
import calamityItems from "@/data/items-calamity-scraped.json"
import calamityAccessories from "@/data/items-calamity-accessories-js-puppeteer.json"

# Test in dev environment
pnpm dev

# Once verified, remove suffixes:
mv data/items-calamity-scraped.json data/items-calamity.json
mv data/items-calamity-accessories-js-puppeteer.json data/items-calamity-accessories.json

# Update imports back to:
import calamityItems from "@/data/items-calamity.json"
import calamityAccessories from "@/data/items-calamity-accessories.json"
```

## Scraper Implementation Details

### Cheerio Scraper Architecture

**Base class:** `scripts/scrapers/base-scraper.ts`

-   `fetchPage()` - HTTP request with User-Agent
-   `loadHtml()` - Parse HTML with Cheerio
-   `parseRarity()` - Extract rarity (returns 0 - not reliably parseable)
-   `parseDamage()` - Extract damage from text

**Mod-specific scrapers:**

-   `vanilla-scraper.ts` - Extends BaseWikiScraper
-   `calamity-scraper.ts` - Extends BaseWikiScraper
-   `thorium-scraper.ts` - Extends BaseWikiScraper

Each implements:

-   `scrapeWeapons()` - Multiple weapon categories
-   `scrapeArmor()` - Armor pieces (filters out accessories)
-   `scrapeBosses()` - Boss list with progression
-   `scrapeAmmunition()` - Arrows, bullets, rockets

**Main orchestrator:** `scripts/scrape-all-wikis.ts`

-   Runs all three scrapers sequentially
-   Assigns mod-specific ID ranges
-   Adds boss `order` field (index + 1)
-   Writes JSON files with `-scraped` suffix

### Puppeteer Scraper Architecture

**Main class:** `scripts/scrapers/puppeteer-universal-scraper.ts`

-   `scrapeAccessories()` - Click/expand accessory tables
-   `scrapeBuffs()` - Click/expand buff/potion tables
-   `scrapeAll()` - Run both scrapes in one session

**Features:**

-   Stealth plugin for Cloudflare bypass
-   Headless browser automation
-   Waits for JavaScript to execute
-   Clicks `.mw-collapsible-toggle` elements
-   Extracts item names from revealed tables
-   Filters out category headings and armor pieces

**Main orchestrator:** `scripts/scrape-js-sections.ts`

-   Creates scraper instances for all mods
-   Assigns mod-specific ID ranges
-   Separates accessories and buffs into different files
-   Writes JSON files with `-js-puppeteer` suffix

### Boss Order System

The boss `order` field is **critical** for the app:

```typescript
// In scrape-all-wikis.ts:
const bossData: Boss[] = bosses.map((boss, index) => {
    return {
        id: index + 1,
        ...boss,
        mod: "vanilla",
        order: index + 1, // Sequential order based on array index
    }
})
```

**Why order matters:**

-   CollectionViewer sorts loadouts by boss progression
-   Boss dropdowns show bosses in correct progression order
-   Users expect pre-hardmode → hardmode → post-moonlord ordering

**How it works:**

-   Scrapers assign sequential order based on array index
-   `lib/terraria/bosses.ts` provides `getBossOrder(bossName)` utility
-   UI components import and use `getBossOrder()` for sorting

**Old system (deprecated):**

-   ❌ 47 hardcoded boss names in CollectionViewer.tsx
-   ❌ Required code changes to add new bosses
-   ❌ Prone to typos and mismatches

**New system (current):**

-   ✅ Order stored in JSON data
-   ✅ Dynamic loading from files
-   ✅ Partial name matching for flexibility
-   ✅ No hardcoded boss lists in UI code

## Troubleshooting

### Issue: Cheerio scraper returns 0 items

**Possible causes:**

-   Wiki HTML structure changed
-   Incorrect CSS selectors
-   Page failed to load (404, 500)

**Solutions:**

```bash
# Check if wiki URL is accessible
curl https://calamitymod.wiki.gg/wiki/Melee_weapons

# Run scraper with verbose logging
pnpm scrape:all 2>&1 | tee scraper-log.txt

# Update selectors in scraper file if structure changed
```

### Issue: Puppeteer returns 0 items or gets Cloudflare blocked

**Possible causes:**

-   Cloudflare updated protection
-   Wiki JavaScript structure changed
-   Browser launch failed

**Solutions:**

```bash
# Try non-headless mode (for debugging)
# Edit puppeteer-universal-scraper.ts:
# Change: headless: "new"
# To: headless: false

# Update stealth plugin
pnpm update puppeteer-extra-plugin-stealth

# Increase wait times
# Edit wait times in scraper from 2000ms to 5000ms
```

### Issue: Vanilla Puppeteer returns 0 items

**This is expected!** Vanilla wiki uses different JavaScript structure that's incompatible with Puppeteer.

**Solutions:**

-   Use Cheerio scraper for Vanilla weapons/armor
-   Manually curate Vanilla accessories if needed
-   Consider using legacy generator scripts for Vanilla

### Issue: Boss order missing

**This was a past issue, now fixed!**

```bash
# Re-run scraper to regenerate boss files with order field
pnpm scrape:all

# Verify order field exists:
cat data/bosses-vanilla-scraped.json | grep '"order"'
```

### Issue: Accessories include armor pieces

**Already filtered!** Current scrapers detect and exclude armor:

```typescript
// In puppeteer-universal-scraper.ts:
const isArmor = name
    .toLowerCase()
    .match(
        /(helmet|mask|hood|cap|hat|chestplate|breastplate|mail|tunic|greaves|leggings|pants|boots)/i
    )
if (isArmor) continue // Skip armor pieces
```

### Issue: Too many/too few items

**This varies by wiki content:**

-   Calamity has 1000+ items (large overhaul mod)
-   Thorium has 500+ items (medium-sized mod)
-   Vanilla has 700+ items

**To reduce:**

-   Filter by rarity (keep only rarity 5+)
-   Filter by progression (keep only hardmode+)
-   Use manual curation

## Performance Optimization

### Cheerio Scraper

**Speed:** ~30 seconds for all three wikis

**Rate limiting:**

-   1 second delay between requests
-   Respects wiki servers

**Parallelization:**

-   Could parallelize mod scrapers
-   Currently sequential for safety

### Puppeteer Scraper

**Speed:** ~2-3 minutes for Calamity + Thorium

**Bottlenecks:**

-   Browser startup time
-   JavaScript rendering
-   Page navigation

**Optimization tips:**

-   Reuse browser instance across mods
-   Reduce wait times after sufficient testing
-   Run only when needed (not every build)

## Advanced Usage

### Custom Scraper Configuration

You can modify scrapers for custom wiki pages:

```typescript
// In calamity-scraper.ts:
async scrapeWeapons(): Promise<ScrapedItem[]> {
    const categories = [
        "/wiki/Melee_weapons",
        "/wiki/Ranged_weapons",
        "/wiki/Magic_weapons",
        "/wiki/Summon_weapons",
        "/wiki/Rogue_weapons",  // Calamity-specific
        "/wiki/YOUR_CUSTOM_CATEGORY",  // Add custom page
    ]

    // ... rest of implementation
}
```

### Exporting for External Use

Scraped data can be used outside the app:

```bash
# Generate clean JSON for external tools
pnpm scrape:all
cat data/items-calamity-scraped.json | jq '.' > external-export.json
```

### Scheduling Automated Scraping

For production environments tracking mod updates:

```bash
# cron job (daily at 3 AM)
0 3 * * * cd /path/to/terraria-loadout-maker && pnpm scrape:all && pnpm scrape:js

# GitHub Action (weekly)
# .github/workflows/scrape-weekly.yml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm scrape:all && pnpm scrape:js
      - run: git commit -am "Update scraped data" && git push
```

## Summary

**Two scrapers, one complete dataset:**

1. **Cheerio (static HTML):** Fast extraction of weapons, armor, ammo, bosses
2. **Puppeteer (JavaScript):** Browser automation for accessories and buffs

**Run both for complete coverage:**

```bash
pnpm scrape:all && pnpm scrape:js
```

**Current capabilities:**

-   ✅ 1920 weapons scraped (Vanilla 417 + Calamity 774 + Thorium 729)
-   ✅ 334 armor pieces scraped (Vanilla 70 + Calamity 66 + Thorium 198)
-   ✅ 95 ammunition types scraped (Vanilla 48 + Calamity 19 + Thorium 28)
-   ✅ 55 bosses scraped (Vanilla 18 + Calamity 26 + Thorium 11)
-   ✅ 859 accessories scraped (Vanilla 378 + Calamity 217 + Thorium 264)
-   ✅ 90 buffs/potions scraped (Vanilla 56 + Calamity 18 + Thorium 16)

**Known limitations:**

-   ⚠️ **Vanilla uses AJAX-loaded tables:** Accessories/potions pages use `data-ajax-source` attributes. The Puppeteer scraper now fetches these fragments automatically, but requires browser fetch API support.
-   ❌ **Rarity not reliably extracted:** Defaults to 0 for most items
-   ❌ **Requires manual review before production use:** Scraped data may contain errors

## Known Issues

### Issue 1: Vanilla AJAX Tables (RESOLVED ✅)

**Status:** 🟢 RESOLVED

**Problem:** Vanilla wiki (https://terraria.wiki.gg/wiki/Accessories) uses AJAX-loaded table placeholders with `data-ajax-source` attributes. Tables appeared as empty `<table class="terraria ajax">` stubs with only 1-2 rows containing "Click/tap here to reveal" messages.

**What was wrong:**

-   Puppeteer couldn't trigger the wiki's AJAX table loading mechanism
-   Clicking toggles had no effect on AJAX placeholder tables
-   Tables remained empty with only placeholder content

**Fix applied:**

1. Detect tables with class `terraria ajax`
2. Extract `data-ajax-source` attribute containing fragment URL
3. Fetch fragment HTML using browser's fetch API within page context
4. Replace placeholder table with fetched content
5. Extract accessory/potion names from populated tables

**Results after fix:**

-   ✅ 378 accessories (up from 0)
-   ✅ 56 potions (up from 0)

**Date fixed:** January 2025

### Issue 2: Healer_weapons 404 Error (FIXED ✅)

**Status:** 🟢 RESOLVED

**Problem:** Thorium mod renamed "Healer" class to "Radiant" in recent update. Scraper was requesting `/wiki/Healer_weapons` which returned 404.

**Fix applied:** Changed `thorium-scraper.ts` to use `/wiki/Radiant_weapons`

**Date fixed:** January 2025

### Issue 3: Thorium Table Structure (FIXED ✅)

**Status:** 🟢 RESOLVED

**Problem:** Thorium wiki uses different HTML table structure than Vanilla/Calamity wikis. Weapon tables have different column layouts, and armor table includes image column before name. Original scraper expected Vanilla/Calamity column positions, causing it to extract only 56 items (mostly headers).

**What was wrong:**

-   Weapon tables: Name in column 1 (after image column 0), not in first `<a>` tag
-   Armor tables: Multiple category sections (Pre-Hardmode, Hardmode, Thrower, Healer, Bard) with different structure

**Fix applied:**

1. Updated weapon scraper to use `$(cells[1])` for name extraction (column 1 after image)
2. Updated armor scraper to parse defense values from columns 2-4 (head/chest/legs)
3. Added section header filtering to skip navigation text
4. Split armor sets into individual pieces (Headgear/Mail/Greaves)

**Results after fix:**

-   ✅ 729 weapons (up from 56 invalid entries)
-   ✅ 198 armor pieces from 66 sets (up from 2 pieces)
-   ✅ 264 accessories (Puppeteer)
-   ✅ 16 buffs/potions (Puppeteer)

**Date fixed:** January 2025

---

**Next steps:**

1. Run scrapers
2. Review generated files
3. Merge or replace production files
4. Test in dev environment
5. Deploy to production
