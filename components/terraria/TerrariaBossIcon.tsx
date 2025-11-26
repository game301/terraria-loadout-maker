/**
 * TerrariaBossIcon Component
 * Reusable component for displaying Terraria boss icons with automatic fallback handling
 */

import Image from "next/image"
import { getBossImageUrl, handleImageError } from "@/lib/terraria/images"

interface TerrariaBossIconProps {
    bossName: string
    mod?: string
    size?: number
    className?: string
    onClick?: () => void
    selected?: boolean
}

export function TerrariaBossIcon({
    bossName,
    mod,
    size = 64,
    className = "",
    onClick,
    selected = false,
}: TerrariaBossIconProps) {
    const imageUrl = getBossImageUrl(bossName, mod)

    return (
        <div
            className={`relative ${
                onClick ? "cursor-pointer" : ""
            } ${className}`}
            onClick={onClick}>
            <img
                src={imageUrl}
                alt={bossName}
                className={`w-full h-full object-contain transition-all ${
                    selected
                        ? "ring-2 ring-blue-500 scale-110"
                        : "hover:scale-105"
                }`}
                onError={(e) => handleImageError(e, bossName, mod, size)}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    imageRendering: "pixelated",
                }}
            />
        </div>
    )
}
