/**
 * Integration tests for image utility functions
 * Tests the centralized image URL generation and fallback logic
 */

import {
    getItemImageUrl,
    getBossImageUrl,
    getTextFallbackImage,
} from "@/lib/terraria/images"

describe("Image Utilities Integration Tests", () => {
    describe("getItemImageUrl", () => {
        it("should generate vanilla item URL correctly", () => {
            const url = getItemImageUrl("Terra Blade", "vanilla")
            expect(url).toBe("https://terraria.wiki.gg/images/Terra_Blade.png")
        })

        it("should generate Calamity item URL correctly", () => {
            const url = getItemImageUrl("Drataliornus", "calamity")
            expect(url).toBe(
                "https://calamitymod.wiki.gg/images/Drataliornus.png"
            )
        })

        it("should generate Thorium item URL correctly", () => {
            const url = getItemImageUrl("Mjolnir", "thorium")
            expect(url).toBe("https://thoriummod.wiki.gg/images/Mjolnir.png")
        })

        it("should use override for Enchanted Sword", () => {
            const url = getItemImageUrl("Enchanted Sword", "vanilla")
            // Note: encodeURIComponent double-encodes the %28 and %29
            expect(url).toBe(
                "https://terraria.wiki.gg/images/Enchanted_Sword_%2528item%2529.png"
            )
        })

        it("should use override for Fabstaff (renamed to Sylvestaff)", () => {
            const url = getItemImageUrl("Fabstaff", "calamity")
            expect(url).toBe(
                "https://calamitymod.wiki.gg/images/Sylvestaff.png"
            )
        })

        it("should handle Auric Tesla armor correctly", () => {
            const url = getItemImageUrl("Auric Tesla Royal Helm", "calamity")
            expect(url).toBe(
                "https://calamitymod.wiki.gg/images/Auric_Tesla_Royal_Helm.png"
            )
        })

        it("should handle items with spaces and apostrophes", () => {
            const url = getItemImageUrl("Night's Edge", "vanilla")
            // Apostrophe is not encoded by encodeURIComponent when part of the URL
            expect(url).toContain("Night's_Edge.png")
        })

        it("should default to vanilla wiki when mod not specified", () => {
            const url = getItemImageUrl("Copper Shortsword")
            expect(url).toBe(
                "https://terraria.wiki.gg/images/Copper_Shortsword.png"
            )
        })
    })

    describe("getBossImageUrl", () => {
        it("should generate vanilla boss URL correctly", () => {
            const url = getBossImageUrl("King Slime", "vanilla")
            expect(url).toBe("https://terraria.wiki.gg/images/King_Slime.png")
        })

        it("should use override for The Twins", () => {
            const url = getBossImageUrl("The Twins", "vanilla")
            expect(url).toBe("https://terraria.wiki.gg/images/The_Twins.png")
        })

        it("should use map icon for Leviathan and Anahita", () => {
            const url = getBossImageUrl("Leviathan and Anahita", "calamity")
            expect(url).toBe(
                "https://calamitymod.wiki.gg/images/Anahita_map.png"
            )
        })

        it("should use map icon for Providence", () => {
            const url = getBossImageUrl(
                "Providence, the Profaned Goddess",
                "calamity"
            )
            expect(url).toBe(
                "https://calamitymod.wiki.gg/images/Providence_map.png"
            )
        })

        it("should handle Thorium boss correctly", () => {
            const url = getBossImageUrl("Lich", "thorium")
            expect(url).toBe(
                "https://thoriummod.wiki.gg/images/Lich_%28Map_icon%29.png"
            )
        })

        it("should remove commas from boss names", () => {
            const url = getBossImageUrl("Test Boss, the Great", "vanilla")
            expect(url).toContain("Test_Boss_the_Great")
        })
    })

    describe("getTextFallbackImage", () => {
        it("should generate SVG data URL with first letter", () => {
            const svg = getTextFallbackImage("Terra Blade", 40)
            expect(svg).toContain("data:image/svg+xml")
            expect(svg).toContain("T") // First letter
        })

        it("should handle different sizes", () => {
            const svg32 = getTextFallbackImage("Item", 32)
            const svg64 = getTextFallbackImage("Item", 64)

            expect(svg32).toContain("width='32'")
            expect(svg32).toContain("height='32'")
            expect(svg64).toContain("width='64'")
            expect(svg64).toContain("height='64'")
        })

        it("should uppercase the first letter", () => {
            const svg = getTextFallbackImage("copper shortsword", 40)
            expect(svg).toContain("C")
            expect(svg).not.toContain("c>")
        })

        it("should use default size of 40 when not specified", () => {
            const svg = getTextFallbackImage("Item")
            expect(svg).toContain("width='40'")
        })
    })
})
