/**
 * Terraria Image Utilities
 * Centralized functions for fetching and handling Terraria item and boss images
 */

// Boss icon overrides - use map icons for better quality
const BOSS_ICON_OVERRIDES: { [key: string]: string } = {
    // Vanilla

    // Calamity map icons
    "The Hive Mind": "https://calamitymod.wiki.gg/images/Hive_Mind_map.png",
    "Providence, the Profaned Goddess":
        "https://calamitymod.wiki.gg/images/Providence_map.png",
    "Signus, Envoy of the Devourer":
        "https://calamitymod.wiki.gg/images/Signus_map.png",
    "Yharon, Dragon of Rebirth":
        "https://calamitymod.wiki.gg/images/Yharon_map.png",
    "Supreme Witch, Calamitas":
        "https://calamitymod.wiki.gg/images/Calamitas_map.png",
    // Thorium map icons
}

// Item icon overrides - use specific URLs for items with special cases
const ITEM_ICON_OVERRIDES: { [key: string]: string } = {
    // Add item overrides here as needed
    // Example: "Item Name": "https://wiki.gg/images/Item_Name.png",
}

// Item name overrides for special wiki naming conventions
const ITEM_NAME_OVERRIDES: { [key: string]: string } = {
    // Vanilla items that use different wiki file names or formats
    // Example: "Item Name": "Item_Name_(item)",
}

/**
 * Get the image URL for a boss
 * @param bossName - Name of the boss
 * @param mod - Mod the boss is from (vanilla, calamity, thorium)
 * @returns URL string for the boss image
 */
export function getBossImageUrl(bossName: string, mod?: string): string {
    // Check for override first
    if (BOSS_ICON_OVERRIDES[bossName]) {
        return BOSS_ICON_OVERRIDES[bossName]
    }

    // Format name for wiki URL
    const formattedName = bossName.replace(/ /g, "_").replace(/,/g, "")
    const encodedName = encodeURIComponent(formattedName)

    // Return appropriate wiki URL based on mod
    if (mod === "calamity") {
        return `https://calamitymod.wiki.gg/images/${encodedName}.png`
    } else if (mod === "thorium") {
        return `https://thoriummod.wiki.gg/images/${encodedName}.png`
    }

    // Default to vanilla Terraria wiki
    return `https://terraria.wiki.gg/images/${encodedName}.png`
}

/**
 * Get the image URL for an item
 * @param itemName - Name of the item
 * @param mod - Mod the item is from (vanilla, calamity, thorium)
 * @returns URL string for the item image
 */
export function getItemImageUrl(itemName: string, mod?: string): string {
    // Check for override first
    if (ITEM_ICON_OVERRIDES[itemName]) {
        return ITEM_ICON_OVERRIDES[itemName]
    }

    // Use override name if available, otherwise format normally
    const formattedName =
        ITEM_NAME_OVERRIDES[itemName] || itemName.replace(/ /g, "_")
    const encodedName = encodeURIComponent(formattedName)

    // Return appropriate wiki URL based on mod
    if (mod === "calamity") {
        return `https://calamitymod.wiki.gg/images/${encodedName}.png`
    } else if (mod === "thorium") {
        return `https://thoriummod.wiki.gg/images/${encodedName}.png`
    }

    // Default to vanilla Terraria wiki
    return `https://terraria.wiki.gg/images/${encodedName}.png`
}

/**
 * Generate a text-based fallback SVG image
 * @param text - Text to display (usually first letter)
 * @param size - Size of the image in pixels
 * @returns Data URI for an SVG image
 */
export function getTextFallbackImage(text: string, size: number = 40): string {
    const initial = text.charAt(0).toUpperCase()
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Crect fill='%23374151' width='${size}' height='${size}' rx='4'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='%23fff' font-size='${
        size * 0.5
    }' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`
}

/**
 * Handle image loading errors with multiple fallback attempts
 * @param e - Image error event
 * @param itemName - Name of the item/boss
 * @param mod - Mod the item is from
 * @param size - Size for final text fallback
 */
export function handleImageError(
    e: React.SyntheticEvent<HTMLImageElement>,
    itemName: string,
    mod?: string,
    size: number = 40
): void {
    const target = e.currentTarget

    // Track which attempts have been made
    if (!target.dataset.attempt) {
        target.dataset.attempt = "0"
    }
    const attempt = parseInt(target.dataset.attempt)

    if (attempt === 0 && (mod === "calamity" || mod === "thorium")) {
        // Attempt 1: Try with item sprite naming (no spaces/special chars)
        target.dataset.attempt = "1"
        const itemSpriteName = itemName.replace(/[^a-zA-Z0-9]/g, "")
        if (mod === "calamity") {
            target.src = `https://calamitymod.wiki.gg/images/${encodeURIComponent(
                itemSpriteName
            )}.png`
        } else if (mod === "thorium") {
            target.src = `https://thoriummod.wiki.gg/images/${encodeURIComponent(
                itemSpriteName
            )}.png`
        }
    } else if (attempt === 1 && (mod === "calamity" || mod === "thorium")) {
        // Attempt 2: Try with (item) suffix - common wiki pattern
        target.dataset.attempt = "2"
        const formattedName = itemName.replace(/ /g, "_")
        const encodedName = encodeURIComponent(formattedName)
        if (mod === "calamity") {
            target.src = `https://calamitymod.wiki.gg/images/${encodedName}_%28item%29.png`
        } else if (mod === "thorium") {
            target.src = `https://thoriummod.wiki.gg/images/${encodedName}_%28item%29.png`
        }
    } else if (attempt === 2 && (mod === "calamity" || mod === "thorium")) {
        // Attempt 3: Try .gif extension
        target.dataset.attempt = "3"
        const formattedName = itemName.replace(/ /g, "_")
        const encodedName = encodeURIComponent(formattedName)
        if (mod === "calamity") {
            target.src = `https://calamitymod.wiki.gg/images/${encodedName}.gif`
        } else if (mod === "thorium") {
            target.src = `https://thoriummod.wiki.gg/images/${encodedName}.gif`
        }
    } else if (attempt === 3 && (mod === "calamity" || mod === "thorium")) {
        // Attempt 4: Try lowercase version
        target.dataset.attempt = "4"
        const formattedName = itemName.replace(/ /g, "_").toLowerCase()
        const encodedName = encodeURIComponent(formattedName)
        if (mod === "calamity") {
            target.src = `https://calamitymod.wiki.gg/images/${encodedName}.png`
        } else if (mod === "thorium") {
            target.src = `https://thoriummod.wiki.gg/images/${encodedName}.png`
        }
    } else {
        // Final fallback: text-based image
        target.dataset.attempt = "final"
        target.src = getTextFallbackImage(itemName, size)
    }
}
