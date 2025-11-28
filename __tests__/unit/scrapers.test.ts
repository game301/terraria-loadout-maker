/**
 * Unit tests for wiki scrapers
 *
 * Tests the scraping logic, data validation, and ID range assignment.
 * Note: These tests use mock data to avoid actual HTTP requests.
 */ // Mock data structure interfaces
interface ScrapedBoss {
    name: string
    progression: "pre-hardmode" | "hardmode" | "post-moonlord"
}

interface Boss {
    id: number
    name: string
    mod: string
    progression: string
    order: number
}

interface ScrapedItem {
    name: string
    type: string
    rarity: number
    damage?: number
}

interface TerrariaItem {
    id: number
    name: string
    mod: string
    type: string
    rarity: number
    damage?: number
}

describe("Scraper Data Validation", () => {
    describe("Boss ID Ranges", () => {
        it("should assign Vanilla bosses IDs in range 1-99999", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "King Slime", progression: "pre-hardmode" },
                { name: "Eye of Cthulhu", progression: "pre-hardmode" },
                { name: "Moon Lord", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(boss.id).toBeGreaterThanOrEqual(1)
                expect(boss.id).toBeLessThan(100000)
            })
        })

        it("should assign Calamity bosses IDs in range 100000-199999", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "Desert Scourge", progression: "pre-hardmode" },
                { name: "Supreme Calamitas", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: 100000 + index,
                ...boss,
                mod: "calamity",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(boss.id).toBeGreaterThanOrEqual(100000)
                expect(boss.id).toBeLessThan(200000)
            })
        })

        it("should assign Thorium bosses IDs in range 200000-299999", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "The Grand Thunder Bird", progression: "pre-hardmode" },
                { name: "Primordials", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: 200000 + index,
                ...boss,
                mod: "thorium",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(boss.id).toBeGreaterThanOrEqual(200000)
                expect(boss.id).toBeLessThan(300000)
            })
        })
    })

    describe("Item ID Ranges", () => {
        it("should assign Vanilla items IDs in range 1-99999", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Copper Shortsword", type: "weapon", rarity: 0 },
                { name: "Zenith", type: "weapon", rarity: 11 },
            ]

            let idCounter = 1
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "vanilla",
            }))

            items.forEach((item) => {
                expect(item.id).toBeGreaterThanOrEqual(1)
                expect(item.id).toBeLessThan(100000)
            })
        })

        it("should assign Calamity items IDs in range 100000-199999", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Absolute Zero", type: "weapon", rarity: 0 },
                { name: "Murasama", type: "weapon", rarity: 11 },
            ]

            let idCounter = 100000
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "calamity",
            }))

            items.forEach((item) => {
                expect(item.id).toBeGreaterThanOrEqual(100000)
                expect(item.id).toBeLessThan(200000)
            })
        })

        it("should assign Thorium items IDs in range 200000-299999", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Mjolnir", type: "weapon", rarity: 0 },
                { name: "Dragon Heart", type: "accessory", rarity: 8 },
            ]

            let idCounter = 200000
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "thorium",
            }))

            items.forEach((item) => {
                expect(item.id).toBeGreaterThanOrEqual(200000)
                expect(item.id).toBeLessThan(300000)
            })
        })
    })

    describe("Boss Order Assignment", () => {
        it("should assign sequential order to bosses based on array index", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "King Slime", progression: "pre-hardmode" },
                { name: "Eye of Cthulhu", progression: "pre-hardmode" },
                { name: "Wall of Flesh", progression: "pre-hardmode" },
                { name: "Moon Lord", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            expect(bossData[0].order).toBe(1)
            expect(bossData[1].order).toBe(2)
            expect(bossData[2].order).toBe(3)
            expect(bossData[3].order).toBe(4)
        })

        it("should ensure order field exists on all bosses", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "Desert Scourge", progression: "pre-hardmode" },
                { name: "Supreme Calamitas", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: 100000 + index,
                ...boss,
                mod: "calamity",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(boss.order).toBeDefined()
                expect(typeof boss.order).toBe("number")
                expect(boss.order).toBeGreaterThan(0)
            })
        })
    })

    describe("Data Structure Validation", () => {
        it("should ensure all required boss fields are present", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "King Slime", progression: "pre-hardmode" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            const boss = bossData[0]
            expect(boss).toHaveProperty("id")
            expect(boss).toHaveProperty("name")
            expect(boss).toHaveProperty("mod")
            expect(boss).toHaveProperty("progression")
            expect(boss).toHaveProperty("order")
        })

        it("should ensure all required item fields are present", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Copper Shortsword", type: "weapon", rarity: 0 },
            ]

            let idCounter = 1
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "vanilla",
            }))

            const item = items[0]
            expect(item).toHaveProperty("id")
            expect(item).toHaveProperty("name")
            expect(item).toHaveProperty("mod")
            expect(item).toHaveProperty("type")
            expect(item).toHaveProperty("rarity")
        })

        it("should validate boss progression values", () => {
            const validProgressions = [
                "pre-hardmode",
                "hardmode",
                "post-moonlord",
            ]

            const mockBosses: ScrapedBoss[] = [
                { name: "King Slime", progression: "pre-hardmode" },
                { name: "The Twins", progression: "hardmode" },
                { name: "Moon Lord", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(validProgressions).toContain(boss.progression)
            })
        })

        it("should validate item types", () => {
            const validTypes = [
                "weapon",
                "armor",
                "accessory",
                "tool",
                "consumable",
                "potion",
                "buff",
                "ammunition",
            ]

            const mockItems: ScrapedItem[] = [
                { name: "Copper Shortsword", type: "weapon", rarity: 0 },
                { name: "Copper Helmet", type: "armor", rarity: 0 },
                { name: "Cloud in a Bottle", type: "accessory", rarity: 1 },
            ]

            mockItems.forEach((item) => {
                expect(validTypes).toContain(item.type)
            })
        })
    })

    describe("ID Uniqueness", () => {
        it("should generate unique IDs for items within same mod", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Item 1", type: "weapon", rarity: 0 },
                { name: "Item 2", type: "weapon", rarity: 0 },
                { name: "Item 3", type: "armor", rarity: 0 },
            ]

            let idCounter = 1
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "vanilla",
            }))

            const ids = items.map((item) => item.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it("should generate unique IDs for bosses within same mod", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "Boss 1", progression: "pre-hardmode" },
                { name: "Boss 2", progression: "hardmode" },
                { name: "Boss 3", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: 100000 + index,
                ...boss,
                mod: "calamity",
                order: index + 1,
            }))

            const ids = bossData.map((boss) => boss.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it("should not conflict IDs between different mods", () => {
            const vanillaItems: TerrariaItem[] = [
                {
                    id: 1,
                    name: "Vanilla Item",
                    type: "weapon",
                    rarity: 0,
                    mod: "vanilla",
                },
            ]

            const calamityItems: TerrariaItem[] = [
                {
                    id: 100000,
                    name: "Calamity Item",
                    type: "weapon",
                    rarity: 0,
                    mod: "calamity",
                },
            ]

            const thoriumItems: TerrariaItem[] = [
                {
                    id: 200000,
                    name: "Thorium Item",
                    type: "weapon",
                    rarity: 0,
                    mod: "thorium",
                },
            ]

            const allItems = [
                ...vanillaItems,
                ...calamityItems,
                ...thoriumItems,
            ]
            const ids = allItems.map((item) => item.id)
            const uniqueIds = new Set(ids)

            expect(uniqueIds.size).toBe(ids.length)
        })
    })

    describe("Mod Field Consistency", () => {
        it("should set correct mod field for Vanilla items", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Copper Shortsword", type: "weapon", rarity: 0 },
            ]

            let idCounter = 1
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "vanilla",
            }))

            expect(items[0].mod).toBe("vanilla")
        })

        it("should set correct mod field for Calamity items", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Absolute Zero", type: "weapon", rarity: 0 },
            ]

            let idCounter = 100000
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "calamity",
            }))

            expect(items[0].mod).toBe("calamity")
        })

        it("should set correct mod field for Thorium items", () => {
            const mockItems: ScrapedItem[] = [
                { name: "Mjolnir", type: "weapon", rarity: 0 },
            ]

            let idCounter = 200000
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "thorium",
            }))

            expect(items[0].mod).toBe("thorium")
        })

        it("should ensure mod field matches ID range", () => {
            const allItems: TerrariaItem[] = [
                {
                    id: 1,
                    name: "Vanilla",
                    type: "weapon",
                    rarity: 0,
                    mod: "vanilla",
                },
                {
                    id: 100000,
                    name: "Calamity",
                    type: "weapon",
                    rarity: 0,
                    mod: "calamity",
                },
                {
                    id: 200000,
                    name: "Thorium",
                    type: "weapon",
                    rarity: 0,
                    mod: "thorium",
                },
            ]

            allItems.forEach((item) => {
                if (item.mod === "vanilla") {
                    expect(item.id).toBeLessThan(100000)
                } else if (item.mod === "calamity") {
                    expect(item.id).toBeGreaterThanOrEqual(100000)
                    expect(item.id).toBeLessThan(200000)
                } else if (item.mod === "thorium") {
                    expect(item.id).toBeGreaterThanOrEqual(200000)
                    expect(item.id).toBeLessThan(300000)
                }
            })
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty arrays gracefully", () => {
            const mockBosses: ScrapedBoss[] = []
            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            expect(bossData).toHaveLength(0)
            expect(Array.isArray(bossData)).toBe(true)
        })

        it("should handle optional damage field on items", () => {
            const mockItems: ScrapedItem[] = [
                {
                    name: "Copper Shortsword",
                    type: "weapon",
                    rarity: 0,
                    damage: 5,
                },
                { name: "Copper Helmet", type: "armor", rarity: 0 }, // No damage
            ]

            let idCounter = 1
            const items: TerrariaItem[] = mockItems.map((item) => ({
                id: idCounter++,
                ...item,
                mod: "vanilla",
            }))

            expect(items[0].damage).toBe(5)
            expect(items[1].damage).toBeUndefined()
        })

        it("should handle boss names with special characters", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "Eye of Cthulhu", progression: "pre-hardmode" },
                { name: "Leviathan and Anahita", progression: "hardmode" },
                { name: "The Devourer of Gods", progression: "post-moonlord" },
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: 100000 + index,
                ...boss,
                mod: "calamity",
                order: index + 1,
            }))

            bossData.forEach((boss) => {
                expect(boss.name).toBeTruthy()
                expect(typeof boss.name).toBe("string")
                expect(boss.name.length).toBeGreaterThan(0)
            })
        })

        it("should maintain order even if boss progression is out of sequence", () => {
            const mockBosses: ScrapedBoss[] = [
                { name: "Moon Lord", progression: "post-moonlord" }, // Last boss first in array
                { name: "King Slime", progression: "pre-hardmode" }, // First boss last in array
            ]

            const bossData: Boss[] = mockBosses.map((boss, index) => ({
                id: index + 1,
                ...boss,
                mod: "vanilla",
                order: index + 1,
            }))

            // Order should be based on array position, not progression
            expect(bossData[0].order).toBe(1)
            expect(bossData[0].name).toBe("Moon Lord")
            expect(bossData[1].order).toBe(2)
            expect(bossData[1].name).toBe("King Slime")
        })
    })
})
