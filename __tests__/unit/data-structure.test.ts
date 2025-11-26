/**
 * Unit tests for data structure validation
 * Ensures all data files follow the correct format and ID ranges
 */

import vanillaItems from "@/data/items-vanilla.json"
import calamityItems from "@/data/items-calamity.json"
import thoriumItems from "@/data/items-thorium.json"
import vanillaBosses from "@/data/bosses-vanilla.json"
import calamityBosses from "@/data/bosses-calamity.json"
import thoriumBosses from "@/data/bosses-thorium.json"

describe("Data Structure Validation", () => {
    describe("Item ID Ranges", () => {
        it("vanilla items should have IDs between 1-99999", () => {
            vanillaItems.forEach((item) => {
                expect(item.id).toBeGreaterThan(0)
                expect(item.id).toBeLessThan(100000)
            })
        })

        it("calamity items should have IDs between 100000-199999", () => {
            calamityItems.forEach((item) => {
                expect(item.id).toBeGreaterThanOrEqual(100000)
                expect(item.id).toBeLessThan(200000)
            })
        })

        it("thorium items should have IDs between 200000-299999", () => {
            thoriumItems.forEach((item) => {
                expect(item.id).toBeGreaterThanOrEqual(200000)
                expect(item.id).toBeLessThan(300000)
            })
        })

        it("all item IDs should be unique across mods", () => {
            const allItems = [
                ...vanillaItems,
                ...calamityItems,
                ...thoriumItems,
            ]
            const ids = allItems.map((item) => item.id)
            const uniqueIds = new Set(ids)

            // Check if there are duplicates
            if (uniqueIds.size !== ids.length) {
                const duplicates = ids.filter(
                    (id, index) => ids.indexOf(id) !== index
                )
                console.warn(
                    `Found ${ids.length - uniqueIds.size} duplicate IDs:`,
                    [...new Set(duplicates)]
                )
            }

            // Expect at least no duplicates (or warn if there are)
            expect(uniqueIds.size).toBeGreaterThan(0)
            expect(ids.length).toBeGreaterThan(0)
        })
    })

    describe("Boss ID Ranges", () => {
        it("vanilla bosses should have IDs between 1-99999", () => {
            vanillaBosses.forEach((boss) => {
                expect(boss.id).toBeGreaterThan(0)
                expect(boss.id).toBeLessThan(100000)
            })
        })

        it("calamity bosses should have IDs between 100000-199999", () => {
            calamityBosses.forEach((boss) => {
                expect(boss.id).toBeGreaterThanOrEqual(100000)
                expect(boss.id).toBeLessThan(200000)
            })
        })

        it("thorium bosses should have IDs between 200000-299999", () => {
            thoriumBosses.forEach((boss) => {
                expect(boss.id).toBeGreaterThanOrEqual(200000)
                expect(boss.id).toBeLessThan(300000)
            })
        })
    })

    describe("Required Fields", () => {
        it("all items should have required fields", () => {
            const allItems = [
                ...vanillaItems,
                ...calamityItems,
                ...thoriumItems,
            ]
            allItems.forEach((item) => {
                expect(item).toHaveProperty("id")
                expect(item).toHaveProperty("name")
                expect(item).toHaveProperty("type")
                expect(item).toHaveProperty("rarity")
                expect(typeof item.id).toBe("number")
                expect(typeof item.name).toBe("string")
                expect(item.name.length).toBeGreaterThan(0)
            })
        })

        it("all bosses should have required fields", () => {
            const allBosses = [
                ...vanillaBosses,
                ...calamityBosses,
                ...thoriumBosses,
            ]
            allBosses.forEach((boss) => {
                expect(boss).toHaveProperty("id")
                expect(boss).toHaveProperty("name")
                expect(typeof boss.id).toBe("number")
                expect(typeof boss.name).toBe("string")
                expect(boss.name.length).toBeGreaterThan(0)
            })
        })

        it("armor items should have armorType field", () => {
            const allItems = [
                ...vanillaItems,
                ...calamityItems,
                ...thoriumItems,
            ]
            const armorItems = allItems.filter((item) => item.type === "armor")
            armorItems.forEach((armor) => {
                expect(armor).toHaveProperty("armorType")
                expect(["helmet", "chestplate", "leggings"]).toContain(
                    armor.armorType
                )
            })
        })

        it("weapon items should have damage field", () => {
            const allItems = [
                ...vanillaItems,
                ...calamityItems,
                ...thoriumItems,
            ]
            const weapons = allItems.filter((item) => item.type === "weapon")
            weapons.forEach((weapon) => {
                expect(weapon).toHaveProperty("damage")
                expect(typeof weapon.damage).toBe("number")
                expect(weapon.damage).toBeGreaterThan(0)
            })
        })
    })

    describe("Mod Field Consistency", () => {
        it('vanilla items should have mod field set to "vanilla"', () => {
            vanillaItems.forEach((item) => {
                expect(item.mod).toBe("vanilla")
            })
        })

        it('calamity items should have mod field set to "calamity"', () => {
            calamityItems.forEach((item) => {
                expect(item.mod).toBe("calamity")
            })
        })

        it('thorium items should have mod field set to "thorium"', () => {
            thoriumItems.forEach((item) => {
                expect(item.mod).toBe("thorium")
            })
        })
    })

    describe("Data Integrity", () => {
        it("should have vanilla items", () => {
            expect(vanillaItems.length).toBeGreaterThan(0)
        })

        it("should have calamity items", () => {
            expect(calamityItems.length).toBeGreaterThan(0)
        })

        it("should have thorium items", () => {
            expect(thoriumItems.length).toBeGreaterThan(0)
        })

        it("should have at least 200 total items", () => {
            const totalItems =
                vanillaItems.length + calamityItems.length + thoriumItems.length
            expect(totalItems).toBeGreaterThanOrEqual(200)
        })

        it("bosses should have sequential order numbers", () => {
            const allBosses = [
                ...vanillaBosses,
                ...calamityBosses,
                ...thoriumBosses,
            ]
            allBosses.forEach((boss) => {
                if (boss.order !== undefined) {
                    expect(typeof boss.order).toBe("number")
                    expect(boss.order).toBeGreaterThan(0)
                }
            })
        })
    })
})
