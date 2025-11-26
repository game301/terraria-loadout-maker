# Data Structure Rules

**Last Updated:** November 25, 2025

## File Naming Convention

All data files MUST follow this pattern:

```
{category}-{mod}.json
```

### Examples:

-   `items-vanilla.json` - Vanilla Terraria items
-   `items-calamity.json` - Calamity Mod items
-   `items-thorium.json` - Thorium Mod items
-   `bosses-vanilla.json` - Vanilla Terraria bosses
-   `bosses-calamity.json` - Calamity Mod bosses
-   `buffs-vanilla.json` - Vanilla consumables/buffs
-   `ammo-calamity.json` - Calamity ammunition

## ID System

### Non-Overlapping ID Ranges

IDs MUST be unique across all mods within a category to prevent conflicts.

**ID Ranges by Mod:**

-   **Vanilla:** 1 - 99,999
-   **Calamity:** 100,000 - 199,999
-   **Thorium:** 200,000 - 299,999

### Examples:

```json
// items-vanilla.json
{"id": 1, "name": "Copper Shortsword", "mod": "vanilla"}

// items-calamity.json
{"id": 100001, "name": "Abyss Blade", "mod": "calamity"}

// items-thorium.json
{"id": 200001, "name": "Mjolnir", "mod": "thorium"}
```

## Data Categories

### 1. Items

**Files:** `items-{mod}.json`

**Required Fields:**

-   `id` (number) - Unique ID following range rules
-   `name` (string) - Item display name
-   `mod` (string) - "vanilla" | "calamity" | "thorium"
-   `type` (string) - "weapon" | "armor" | "accessory"
-   `rarity` (number) - 0-11 (item color tier)

**Optional Fields:**

-   `damage` (number) - For weapons only
-   `defense` (number) - For armor only
-   `weaponClass` (string) - "melee" | "ranged" | "magic" | "summoner"
-   `armorType` (string) - "helmet" | "chestplate" | "leggings"

**Fields to EXCLUDE:**

-   Internal game IDs
-   Sprite paths
-   Crafting recipes
-   Sell values
-   Description text

### 2. Bosses

**Files:** `bosses-{mod}.json`

**Required Fields:**

-   `id` (number) - Unique ID following range rules
-   `name` (string) - Boss display name
-   `mod` (string) - "vanilla" | "calamity" | "thorium"
-   `progression` (string) - "pre-hardmode" | "hardmode" | "post-moonlord"
-   `order` (number) - Boss progression order

**Fields to EXCLUDE:**

-   `health` - Not needed for loadout maker
-   `defense` - Not needed for loadout maker
-   `damage` - Not needed for loadout maker
-   Drop tables
-   AI patterns

### 3. Buffs/Consumables

**Files:** `buffs-{mod}.json`

**Required Fields:**

-   `id` (number) - Unique ID following range rules
-   `name` (string) - Buff/potion name
-   `mod` (string) - "vanilla" | "calamity" | "thorium"
-   `type` (string) - Always "consumable"
-   `rarity` (number) - Item rarity tier

### 4. Ammunition

**Files:** `ammo-{mod}.json`

**Required Fields:**

-   `id` (number) - Unique ID following range rules
-   `name` (string) - Ammo name
-   `mod` (string) - "vanilla" | "calamity" | "thorium"
-   `type` (string) - Always "ammo"
-   `rarity` (number) - Item rarity tier

**Optional Fields:**

-   `ammoType` (string) - "arrow" | "bullet" | "rocket" | etc.

## Current Status

### ✅ Properly Structured:

-   `buffs-vanilla.json` - 29 items
-   `buffs-calamity.json` - Items present
-   `buffs-thorium.json` - Items present
-   `ammo-vanilla.json` - Items present
-   `ammo-calamity.json` - Items present
-   `ammo-thorium.json` - Items present

### ⚠️ Needs Restructuring:

-   `items.json` → Split into `items-vanilla.json`, `items-calamity.json`, `items-thorium.json`
-   `bosses-all.json` → Split into `bosses-vanilla.json`, `bosses-calamity.json`, `bosses-thorium.json`
-   `bosses.json` (old vanilla only) → Delete after migration
-   `bosses-calamity.json` → Rename to follow convention

### ❌ Missing Data:

-   `items-calamity.json` - Needs to be fetched from wiki
-   `items-thorium.json` - Needs to be fetched from wiki

## Data Loading Pattern

### In Code:

```typescript
// Load all items from all mods
import vanillaItems from "@/data/items-vanilla.json"
import calamityItems from "@/data/items-calamity.json"
import thoriumItems from "@/data/items-thorium.json"

const allItems = [...vanillaItems, ...calamityItems, ...thoriumItems]

// Filter by mod
const calamityOnly = allItems.filter((item) => item.mod === "calamity")
```

### Benefits:

1. **Modularity** - Easy to add/remove mods
2. **Clear Organization** - Files grouped by category and mod
3. **No ID Conflicts** - Each mod has its own ID range
4. **Minimal Data** - Only store what's needed for the app
5. **Easy Updates** - Update one mod without affecting others

## Maintenance

### When to Re-fetch Data:

-   Major mod updates (new items, bosses)
-   New mod versions released
-   Data corrections needed

### How to Re-fetch:

```bash
pnpm run fetch-items      # Fetch all item data
pnpm run update-boss-data # Update boss data only
```

### Validation Checklist:

-   [ ] All files follow `{category}-{mod}.json` naming
-   [ ] All IDs are within correct range for their mod
-   [ ] No overlapping IDs between mods
-   [ ] No unnecessary fields (HP, defense for bosses)
-   [ ] All required fields present
-   [ ] `mod` field matches filename mod

---

**Remember:** Keep data files minimal! Only store what the loadout maker application actually needs.
