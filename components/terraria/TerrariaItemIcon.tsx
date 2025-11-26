/**
 * TerrariaItemIcon Component
 * Reusable component for displaying Terraria item icons with automatic fallback handling
 */

import { getItemImageUrl, handleImageError } from "@/lib/terraria/images"

interface TerrariaItemIconProps {
    itemName: string
    mod?: string
    size?: number
    className?: string
    onClick?: () => void
    rarity?: number
}

// Rarity color mapping
const RARITY_COLORS: { [key: number]: string } = {
    0: "text-foreground", // White
    1: "text-blue-400", // Blue
    2: "text-green-400", // Green
    3: "text-orange-400", // Orange
    4: "text-red-400", // Light Red
    5: "text-pink-400", // Pink
    6: "text-purple-400", // Purple
    7: "text-lime-400", // Lime
    8: "text-yellow-400", // Yellow
    9: "text-cyan-400", // Cyan
    10: "text-red-500", // Red
    11: "text-pink-500", // Pink variant
}

export function TerrariaItemIcon({
    itemName,
    mod,
    size = 40,
    className = "",
    onClick,
    rarity,
}: TerrariaItemIconProps) {
    const imageUrl = getItemImageUrl(itemName, mod)
    const rarityColor =
        rarity !== undefined
            ? RARITY_COLORS[rarity] || "text-gray-700 dark:text-gray-300"
            : ""

    return (
        <div
            className={`relative ${
                onClick ? "cursor-pointer" : ""
            } ${className}`}
            onClick={onClick}
            title={itemName}>
            <img
                src={imageUrl}
                alt={itemName}
                className={`w-full h-full object-contain ${
                    onClick ? "hover:scale-110 transition-transform" : ""
                }`}
                onError={(e) => handleImageError(e, itemName, mod, size)}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    imageRendering: "pixelated",
                }}
            />
            {rarity !== undefined && (
                <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black ${rarityColor} opacity-80`}
                    style={{ backgroundColor: "currentColor" }}
                />
            )}
        </div>
    )
}

export function getRarityColor(rarity: number): string {
    return RARITY_COLORS[rarity] || "text-gray-700 dark:text-gray-300"
}
