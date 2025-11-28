"use client"

import Link from "next/link"
import { getItemImageUrl } from "@/lib/terraria/images"
import type { Loadout } from "@/lib/terraria/loadouts"

function getTextFallbackImage(text: string, size: number) {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="%23333"/><text x="50%" y="50%" font-family="Arial" font-size="8" fill="%23999" text-anchor="middle" dominant-baseline="middle">${text.slice(
            0,
            10
        )}</text></svg>`
    )}`
}

export default function MyLoadoutsClient({
    loadouts,
}: {
    loadouts: Loadout[]
}) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {loadouts.map((loadout) => {
                // Detect mods used
                const getUsedMods = () => {
                    if (loadout.gameMode === "vanilla") {
                        return "Vanilla"
                    }

                    const allItems = [
                        ...loadout.weapons,
                        ...loadout.accessories,
                        loadout.armor.head,
                        loadout.armor.chest,
                        loadout.armor.legs,
                    ].filter(Boolean)

                    const mods = new Set<string>()
                    allItems.forEach((item: any) => {
                        if (item?.mod === "calamity") mods.add("Calamity")
                        if (item?.mod === "thorium") mods.add("Thorium")
                    })

                    if (mods.size === 0) {
                        return "Vanilla"
                    }

                    return Array.from(mods).join(", ")
                }

                return (
                    <Link
                        key={loadout.id}
                        href={`/my-loadouts/${loadout.id}`}
                        className='bg-gradient-to-b card-dark border-2 border-dark hover:border-yellow-500 rounded-lg p-4 transition-all cursor-pointer'>
                        <h3 className='font-bold text-lg text-yellow-400 mb-2 break-words'>
                            {loadout.name}
                        </h3>

                        {/* Preview items - Show armor (3) + weapons (4) */}
                        <div className='flex gap-2 mb-3 flex-wrap'>
                            {/* Armor pieces */}
                            {loadout.armor.head && (
                                <img
                                    src={getItemImageUrl(
                                        loadout.armor.head.name,
                                        loadout.armor.head.mod
                                    )}
                                    alt={loadout.armor.head.name}
                                    className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            getTextFallbackImage(
                                                loadout.armor.head.name,
                                                40
                                            )
                                    }}
                                />
                            )}
                            {loadout.armor.chest && (
                                <img
                                    src={getItemImageUrl(
                                        loadout.armor.chest.name,
                                        loadout.armor.chest.mod
                                    )}
                                    alt={loadout.armor.chest.name}
                                    className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            getTextFallbackImage(
                                                loadout.armor.chest.name,
                                                40
                                            )
                                    }}
                                />
                            )}
                            {loadout.armor.legs && (
                                <img
                                    src={getItemImageUrl(
                                        loadout.armor.legs.name,
                                        loadout.armor.legs.mod
                                    )}
                                    alt={loadout.armor.legs.name}
                                    className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            getTextFallbackImage(
                                                loadout.armor.legs.name,
                                                40
                                            )
                                    }}
                                />
                            )}
                            {/* Weapons - max 4 */}
                            {loadout.weapons
                                .slice(0, 4)
                                .map((weapon: any, i: number) => (
                                    <img
                                        key={`weapon-${i}`}
                                        src={getItemImageUrl(
                                            weapon.name,
                                            weapon.mod
                                        )}
                                        alt={weapon.name}
                                        className='w-10 h-10 object-contain slot-bg border rounded p-1'
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                getTextFallbackImage(
                                                    weapon.name,
                                                    40
                                                )
                                        }}
                                    />
                                ))}
                        </div>

                        <div className='flex justify-between items-center text-xs text-gray-400'>
                            <div className='flex gap-3'>
                                <span>{getUsedMods()}</span>
                                <span>{loadout.weapons.length} weapons</span>
                                <span>
                                    {loadout.accessories.length} accessories
                                </span>
                            </div>
                        </div>

                        <div className='text-xs text-gray-500 mt-2'>
                            {new Date(loadout.createdAt).toLocaleDateString()}
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
