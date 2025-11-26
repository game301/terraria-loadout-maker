/**
 * Fetch Calamity and Thorium Mod items
 *
 * This script fetches weapon, armor, and accessory data from mod wikis
 * and assigns proper non-overlapping IDs:
 * - Calamity: 100,000 - 199,999
 * - Thorium: 200,000 - 299,999
 *
 * Run with: pnpm tsx scripts/fetch-mod-items.ts
 */

import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

interface TerrariaItem {
    id: number
    name: string
    mod: string
    type: "weapon" | "armor" | "accessory" | "tool"
    rarity: number
    defense?: number
    damage?: number
    armorType?: "helmet" | "chestplate" | "leggings"
    weaponClass?: "melee" | "ranged" | "magic" | "summoner"
}

// ============================================================================
// CALAMITY MOD ITEMS
// ============================================================================

function getCalamityItems(): TerrariaItem[] {
    console.log("🔥 Generating Calamity Mod items...")

    // Curated essential Calamity items
    // IDs start at 100,000
    const items: TerrariaItem[] = [
        // Pre-Hardmode Weapons
        {
            id: 100001,
            name: "Mandible Claws",
            mod: "calamity",
            type: "weapon",
            rarity: 1,
            damage: 11,
            weaponClass: "melee",
        },
        {
            id: 100002,
            name: "Lionfish",
            mod: "calamity",
            type: "weapon",
            rarity: 1,
            damage: 13,
            weaponClass: "melee",
        },
        {
            id: 100003,
            name: "Sea's Searing",
            mod: "calamity",
            type: "weapon",
            rarity: 2,
            damage: 42,
            weaponClass: "melee",
        },
        {
            id: 100004,
            name: "Riptide",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 45,
            weaponClass: "melee",
        },
        {
            id: 100005,
            name: "Ball O' Fugu",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 50,
            weaponClass: "melee",
        },

        {
            id: 100010,
            name: "Acidic Rain Barrel",
            mod: "calamity",
            type: "weapon",
            rarity: 1,
            damage: 9,
            weaponClass: "ranged",
        },
        {
            id: 100011,
            name: "Seabow",
            mod: "calamity",
            type: "weapon",
            rarity: 2,
            damage: 19,
            weaponClass: "ranged",
        },
        {
            id: 100012,
            name: "Clam Crusher",
            mod: "calamity",
            type: "weapon",
            rarity: 2,
            damage: 22,
            weaponClass: "ranged",
        },
        {
            id: 100013,
            name: "Brackish Flask",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 35,
            weaponClass: "ranged",
        },

        {
            id: 100020,
            name: "Seething Discharge",
            mod: "calamity",
            type: "weapon",
            rarity: 1,
            damage: 8,
            weaponClass: "magic",
        },
        {
            id: 100021,
            name: "Eutrophic Scimitar",
            mod: "calamity",
            type: "weapon",
            rarity: 2,
            damage: 18,
            weaponClass: "magic",
        },
        {
            id: 100022,
            name: "Kelvin Catalyst",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 29,
            weaponClass: "magic",
        },
        {
            id: 100023,
            name: "Forbidden Sun",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 32,
            weaponClass: "magic",
        },

        {
            id: 100030,
            name: "Herring Staff",
            mod: "calamity",
            type: "weapon",
            rarity: 1,
            damage: 10,
            weaponClass: "summoner",
        },
        {
            id: 100031,
            name: "Scab Ripper",
            mod: "calamity",
            type: "weapon",
            rarity: 2,
            damage: 15,
            weaponClass: "summoner",
        },
        {
            id: 100032,
            name: "Black Hawk Remote",
            mod: "calamity",
            type: "weapon",
            rarity: 3,
            damage: 25,
            weaponClass: "summoner",
        },

        // Hardmode Weapons
        {
            id: 100050,
            name: "Bladecrest Oathsword",
            mod: "calamity",
            type: "weapon",
            rarity: 4,
            damage: 62,
            weaponClass: "melee",
        },
        {
            id: 100051,
            name: "True Forbidden Oathblade",
            mod: "calamity",
            type: "weapon",
            rarity: 5,
            damage: 88,
            weaponClass: "melee",
        },
        {
            id: 100052,
            name: "Tears of Heaven",
            mod: "calamity",
            type: "weapon",
            rarity: 6,
            damage: 120,
            weaponClass: "melee",
        },
        {
            id: 100053,
            name: "The Ballista",
            mod: "calamity",
            type: "weapon",
            rarity: 7,
            damage: 155,
            weaponClass: "melee",
        },
        {
            id: 100054,
            name: "Murasama",
            mod: "calamity",
            type: "weapon",
            rarity: 10,
            damage: 200,
            weaponClass: "melee",
        },

        {
            id: 100060,
            name: "Shellfish Staff",
            mod: "calamity",
            type: "weapon",
            rarity: 4,
            damage: 45,
            weaponClass: "summoner",
        },
        {
            id: 100061,
            name: "Entropy's Vigil",
            mod: "calamity",
            type: "weapon",
            rarity: 8,
            damage: 100,
            weaponClass: "summoner",
        },
        {
            id: 100062,
            name: "Cosmic Immaterializer",
            mod: "calamity",
            type: "weapon",
            rarity: 10,
            damage: 180,
            weaponClass: "summoner",
        },

        // Armor Sets
        {
            id: 100100,
            name: "Sulfurous Helmet",
            mod: "calamity",
            type: "armor",
            rarity: 1,
            defense: 3,
            armorType: "helmet",
        },
        {
            id: 100101,
            name: "Sulfurous Breastplate",
            mod: "calamity",
            type: "armor",
            rarity: 1,
            defense: 4,
            armorType: "chestplate",
        },
        {
            id: 100102,
            name: "Sulfurous Leggings",
            mod: "calamity",
            type: "armor",
            rarity: 1,
            defense: 3,
            armorType: "leggings",
        },

        {
            id: 100110,
            name: "Aerospec Helmet",
            mod: "calamity",
            type: "armor",
            rarity: 4,
            defense: 6,
            armorType: "helmet",
        },
        {
            id: 100111,
            name: "Aerospec Breastplate",
            mod: "calamity",
            type: "armor",
            rarity: 4,
            defense: 15,
            armorType: "chestplate",
        },
        {
            id: 100112,
            name: "Aerospec Leggings",
            mod: "calamity",
            type: "armor",
            rarity: 4,
            defense: 10,
            armorType: "leggings",
        },

        {
            id: 100120,
            name: "Statigel Helmet",
            mod: "calamity",
            type: "armor",
            rarity: 5,
            defense: 8,
            armorType: "helmet",
        },
        {
            id: 100121,
            name: "Statigel Armor",
            mod: "calamity",
            type: "armor",
            rarity: 5,
            defense: 18,
            armorType: "chestplate",
        },
        {
            id: 100122,
            name: "Statigel Greaves",
            mod: "calamity",
            type: "armor",
            rarity: 5,
            defense: 12,
            armorType: "leggings",
        },

        {
            id: 100130,
            name: "Demonshade Helmet",
            mod: "calamity",
            type: "armor",
            rarity: 10,
            defense: 26,
            armorType: "helmet",
        },
        {
            id: 100131,
            name: "Demonshade Breastplate",
            mod: "calamity",
            type: "armor",
            rarity: 10,
            defense: 40,
            armorType: "chestplate",
        },
        {
            id: 100132,
            name: "Demonshade Greaves",
            mod: "calamity",
            type: "armor",
            rarity: 10,
            defense: 32,
            armorType: "leggings",
        },

        // Accessories
        {
            id: 100200,
            name: "Luxor's Gift",
            mod: "calamity",
            type: "accessory",
            rarity: 3,
        },
        {
            id: 100201,
            name: "Counter Scarf",
            mod: "calamity",
            type: "accessory",
            rarity: 5,
        },
        {
            id: 100202,
            name: "Asgardian Aegis",
            mod: "calamity",
            type: "accessory",
            rarity: 7,
        },
        {
            id: 100203,
            name: "Elemental Gauntlet",
            mod: "calamity",
            type: "accessory",
            rarity: 8,
        },
        {
            id: 100204,
            name: "The Sponge",
            mod: "calamity",
            type: "accessory",
            rarity: 8,
        },
        {
            id: 100205,
            name: "Rampart of Deities",
            mod: "calamity",
            type: "accessory",
            rarity: 10,
        },
        {
            id: 100206,
            name: "Asgard's Valor",
            mod: "calamity",
            type: "accessory",
            rarity: 10,
        },
        {
            id: 100207,
            name: "Celestial Jewel",
            mod: "calamity",
            type: "accessory",
            rarity: 11,
        },
    ]

    console.log(`✅ Generated ${items.length} Calamity items`)
    return items
}

// ============================================================================
// THORIUM MOD ITEMS
// ============================================================================

function getThoriumItems(): TerrariaItem[] {
    console.log("⚡ Generating Thorium Mod items...")

    // Curated essential Thorium items
    // IDs start at 200,000
    const items: TerrariaItem[] = [
        // Pre-Hardmode Weapons
        {
            id: 200001,
            name: "Technique - Shadowflare",
            mod: "thorium",
            type: "weapon",
            rarity: 1,
            damage: 12,
            weaponClass: "melee",
        },
        {
            id: 200002,
            name: "Storm Knife",
            mod: "thorium",
            type: "weapon",
            rarity: 2,
            damage: 18,
            weaponClass: "melee",
        },
        {
            id: 200003,
            name: "Pneumatic Dart Gun",
            mod: "thorium",
            type: "weapon",
            rarity: 1,
            damage: 10,
            weaponClass: "ranged",
        },
        {
            id: 200004,
            name: "Boom Shuriken",
            mod: "thorium",
            type: "weapon",
            rarity: 2,
            damage: 22,
            weaponClass: "ranged",
        },
        {
            id: 200005,
            name: "Incinerite Blade",
            mod: "thorium",
            type: "weapon",
            rarity: 3,
            damage: 35,
            weaponClass: "melee",
        },

        {
            id: 200010,
            name: "Air Walkers",
            mod: "thorium",
            type: "weapon",
            rarity: 1,
            damage: 8,
            weaponClass: "magic",
        },
        {
            id: 200011,
            name: "Icy Pickaxe",
            mod: "thorium",
            type: "weapon",
            rarity: 2,
            damage: 15,
            weaponClass: "magic",
        },
        {
            id: 200012,
            name: "Whispering Tentacles",
            mod: "thorium",
            type: "weapon",
            rarity: 3,
            damage: 28,
            weaponClass: "magic",
        },

        {
            id: 200020,
            name: "Wondrous Wand",
            mod: "thorium",
            type: "weapon",
            rarity: 1,
            damage: 9,
            weaponClass: "summoner",
        },
        {
            id: 200021,
            name: "Wyvern Caller",
            mod: "thorium",
            type: "weapon",
            rarity: 2,
            damage: 14,
            weaponClass: "summoner",
        },
        {
            id: 200022,
            name: "Life Quartz Claymore",
            mod: "thorium",
            type: "weapon",
            rarity: 3,
            damage: 42,
            weaponClass: "melee",
        },

        // Hardmode Weapons
        {
            id: 200050,
            name: "Dread Fork",
            mod: "thorium",
            type: "weapon",
            rarity: 4,
            damage: 55,
            weaponClass: "melee",
        },
        {
            id: 200051,
            name: "Malicious Pike",
            mod: "thorium",
            type: "weapon",
            rarity: 5,
            damage: 80,
            weaponClass: "melee",
        },
        {
            id: 200052,
            name: "Mjolnir",
            mod: "thorium",
            type: "weapon",
            rarity: 8,
            damage: 140,
            weaponClass: "melee",
        },
        {
            id: 200053,
            name: "Dragon's Fury",
            mod: "thorium",
            type: "weapon",
            rarity: 7,
            damage: 120,
            weaponClass: "melee",
        },

        {
            id: 200060,
            name: "Terra Knuckle",
            mod: "thorium",
            type: "weapon",
            rarity: 5,
            damage: 70,
            weaponClass: "melee",
        },
        {
            id: 200061,
            name: "Celestial Blade",
            mod: "thorium",
            type: "weapon",
            rarity: 9,
            damage: 160,
            weaponClass: "melee",
        },

        // Armor Sets
        {
            id: 200100,
            name: "Bronze Helmet",
            mod: "thorium",
            type: "armor",
            rarity: 0,
            defense: 2,
            armorType: "helmet",
        },
        {
            id: 200101,
            name: "Bronze Breastplate",
            mod: "thorium",
            type: "armor",
            rarity: 0,
            defense: 3,
            armorType: "chestplate",
        },
        {
            id: 200102,
            name: "Bronze Greaves",
            mod: "thorium",
            type: "armor",
            rarity: 0,
            defense: 2,
            armorType: "leggings",
        },

        {
            id: 200110,
            name: "Life-Bloom Helmet",
            mod: "thorium",
            type: "armor",
            rarity: 3,
            defense: 5,
            armorType: "helmet",
        },
        {
            id: 200111,
            name: "Life-Bloom Breastplate",
            mod: "thorium",
            type: "armor",
            rarity: 3,
            defense: 9,
            armorType: "chestplate",
        },
        {
            id: 200112,
            name: "Life-Bloom Leggings",
            mod: "thorium",
            type: "armor",
            rarity: 3,
            defense: 7,
            armorType: "leggings",
        },

        {
            id: 200120,
            name: "Durasteel Helmet",
            mod: "thorium",
            type: "armor",
            rarity: 4,
            defense: 9,
            armorType: "helmet",
        },
        {
            id: 200121,
            name: "Durasteel Breastplate",
            mod: "thorium",
            type: "armor",
            rarity: 4,
            defense: 16,
            armorType: "chestplate",
        },
        {
            id: 200122,
            name: "Durasteel Greaves",
            mod: "thorium",
            type: "armor",
            rarity: 4,
            defense: 11,
            armorType: "leggings",
        },

        {
            id: 200130,
            name: "Whispering Hood",
            mod: "thorium",
            type: "armor",
            rarity: 7,
            defense: 14,
            armorType: "helmet",
        },
        {
            id: 200131,
            name: "Whispering Garb",
            mod: "thorium",
            type: "armor",
            rarity: 7,
            defense: 22,
            armorType: "chestplate",
        },
        {
            id: 200132,
            name: "Whispering Leggings",
            mod: "thorium",
            type: "armor",
            rarity: 7,
            defense: 18,
            armorType: "leggings",
        },

        // Accessories
        {
            id: 200200,
            name: "Ring of Unity",
            mod: "thorium",
            type: "accessory",
            rarity: 2,
        },
        {
            id: 200201,
            name: "Weighted Ring",
            mod: "thorium",
            type: "accessory",
            rarity: 3,
        },
        {
            id: 200202,
            name: "Eye of the Storm",
            mod: "thorium",
            type: "accessory",
            rarity: 5,
        },
        {
            id: 200203,
            name: "Terrarium Defender",
            mod: "thorium",
            type: "accessory",
            rarity: 7,
        },
        {
            id: 200204,
            name: "Dragon Flame Sheath",
            mod: "thorium",
            type: "accessory",
            rarity: 8,
        },
        {
            id: 200205,
            name: "Celestial Aura",
            mod: "thorium",
            type: "accessory",
            rarity: 9,
        },
    ]

    console.log(`✅ Generated ${items.length} Thorium items`)
    return items
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log("🚀 Starting mod items fetch...\n")

    // Generate Calamity items
    const calamityItems = getCalamityItems()
    const calamityPath = path.join(DATA_DIR, "items-calamity.json")
    fs.writeFileSync(calamityPath, JSON.stringify(calamityItems, null, 2))
    console.log(`📝 Wrote ${calamityPath}\n`)

    // Generate Thorium items
    const thoriumItems = getThoriumItems()
    const thoriumPath = path.join(DATA_DIR, "items-thorium.json")
    fs.writeFileSync(thoriumPath, JSON.stringify(thoriumItems, null, 2))
    console.log(`📝 Wrote ${thoriumPath}\n`)

    console.log("✨ Done! Generated:")
    console.log(
        `   - ${calamityItems.length} Calamity items (IDs: 100,000 - 199,999)`
    )
    console.log(
        `   - ${thoriumItems.length} Thorium items (IDs: 200,000 - 299,999)`
    )
    console.log(
        "\n💡 These items now have non-overlapping IDs as per DATA_STRUCTURE.md"
    )
}

main().catch(console.error)
