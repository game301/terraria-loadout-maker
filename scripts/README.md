# Data Generation Scripts

**Status:** Archive - One-time use only

These scripts were used to generate the initial data files. The data is now complete and these scripts are **not needed for the application to run**.

## Files

### ✅ Completed & Archived:

-   `fetch-all-items.ts` - Generated `items.json` and `items-calamity.json` from Terraria wikis
-   `fetch-buffs-and-ammo.ts` - Generated `buffs-*.json` and `ammo-*.json` files
-   `fetch-calamity-thorium-armor.ts` - Fetched armor data from mod wikis
-   `merge-armor-data.ts` - Merged armor data into items files
-   `fix-duplicate-potions.ts` - Removed duplicate potions from items.json
-   `fix-data-issues.ts` - General data cleaning and fixes
-   `download-boss-icons.ts` - Downloaded boss icons (now using wiki URLs directly)
-   `update-boss-data.ts` - Updated boss data with current mod versions

## Current Data Files (Generated):

-   `data/items.json` - 253 items (weapons, armor, accessories)
-   `data/bosses-all.json` - 56 bosses
-   `data/buffs-*.json` - Consumables and buffs
-   `data/ammo-*.json` - Ammunition types

## When to Use:

**Only re-run these scripts if:**

1. Terraria or mods get major updates with new items/bosses
2. You need to regenerate data from scratch
3. You're adding a new mod to the system

**Command:** `pnpm run fetch-items`

## Dependencies:

-   `tsx` - TypeScript execution
-   Internet connection - Fetches from wiki APIs

---

**Note:** The application uses direct wiki image URLs for icons, so these scripts are primarily for data generation only. The app will work without ever running these scripts.
