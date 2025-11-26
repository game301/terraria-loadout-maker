/**
 * Loadout management utilities for the Terraria Loadout Maker.
 * Provides functions for creating, reading, updating, and deleting loadouts,
 * as well as managing favorites.
 * @module lib/terraria/loadouts
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Database representation of a loadout (snake_case fields).
 * Matches the structure in the Supabase database.
 */
export interface LoadoutData {
    id: string
    user_id: string
    name: string
    description?: string
    target_boss?: string
    game_mode: string
    helmet?: any
    chest?: any
    legs?: any
    accessories: any
    weapons: any
    buffs: any
    is_public: boolean
    created_at: string
    updated_at: string
    video_link?: string | null
    version_tag?: string | null
    view_count?: number
}

/**
 * Application-level loadout object (camelCase fields).
 * Used throughout the frontend components.
 */
export interface Loadout {
    id: string
    userId: string
    name: string
    description?: string
    targetBoss?: string
    gameMode: string
    armor: {
        head?: any
        chest?: any
        legs?: any
    }
    accessories: any[]
    weapons: any[]
    buffs: any[]
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
    videoLink?: string | null
    versionTag?: string | null
    viewCount?: number
}

/**
 * Input type for creating a new loadout.
 * All fields except name are optional.
 */
export interface CreateLoadoutInput {
    name: string
    description?: string
    targetBoss?: string
    helmet?: any
    chest?: any
    legs?: any
    accessories?: any[]
    weapons?: any[]
    buffs?: any[]
    isPublic?: boolean
}

/**
 * Converts a database loadout record to the application Loadout format.
 * Transforms snake_case fields to camelCase and ensures array fields are properly initialized.
 *
 * @param data - Raw loadout data from the database
 * @returns Loadout object with camelCase fields
 */
function dbToLoadout(data: LoadoutData): Loadout {
    return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        targetBoss: data.target_boss,
        gameMode: data.game_mode,
        armor: {
            head: data.helmet,
            chest: data.chest,
            legs: data.legs,
        },
        accessories: Array.isArray(data.accessories) ? data.accessories : [],
        weapons: Array.isArray(data.weapons) ? data.weapons : [],
        buffs: Array.isArray(data.buffs) ? data.buffs : [],
        isPublic: data.is_public,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        videoLink: data.video_link,
        versionTag: data.version_tag,
        viewCount: data.view_count,
    }
}

/**
 * Creates a new loadout in the database.
 *
 * @param input - Loadout data including armor, weapons, buffs, etc.
 * @param userId - ID of the user creating the loadout
 * @returns The created Loadout object, or null if creation failed
 *
 * @example
 * const loadout = await createLoadout({
 *   name: "Moonlord Ranger",
 *   targetBoss: "Moon Lord",
 *   isPublic: true
 * }, userId);
 */
export async function createLoadout(
    input: CreateLoadoutInput,
    userId: string
): Promise<Loadout | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("loadouts")
        .insert({
            user_id: userId,
            name: input.name,
            description: input.description,
            target_boss: input.targetBoss,
            helmet: input.helmet,
            chest: input.chest,
            legs: input.legs,
            accessories: input.accessories || [],
            weapons: input.weapons || [],
            buffs: input.buffs || [],
            is_public: input.isPublic || false,
        })
        .select()
        .single()

    if (error || !data) {
        console.error("Error creating loadout:", error)
        return null
    }

    return dbToLoadout(data)
}

/**
 * Retrieves all loadouts created by a specific user.
 * Results are ordered by creation date (newest first).
 *
 * @param userId - ID of the user whose loadouts to fetch
 * @returns Array of Loadout objects, empty array if none found or error occurs
 */
export async function getUserLoadouts(userId: string): Promise<Loadout[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error || !data) {
        console.error("Error fetching user loadouts:", error)
        return []
    }

    return data.map(dbToLoadout)
}

/**
 * Retrieves a single loadout by its ID.
 *
 * @param id - UUID of the loadout to fetch
 * @returns The Loadout object if found, null if not found or error occurs
 */
export async function getLoadoutById(id: string): Promise<Loadout | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !data) {
        console.error("Error fetching loadout:", error)
        return null
    }

    return dbToLoadout(data)
}

/**
 * Retrieves public loadouts with pagination support.
 * Only returns loadouts marked as public. Results ordered by creation date (newest first).
 *
 * @param limit - Maximum number of loadouts to return (default: 20)
 * @param offset - Number of loadouts to skip for pagination (default: 0)
 * @returns Array of public Loadout objects
 */
export async function getPublicLoadouts(
    limit: number = 20,
    offset: number = 0
): Promise<Loadout[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (error || !data) {
        console.error("Error fetching public loadouts:", error)
        return []
    }

    return data.map(dbToLoadout)
}

/**
 * Searches public loadouts by name with pagination.
 * Performs case-insensitive partial matching on loadout names.
 *
 * @param query - Search term to match against loadout names
 * @param limit - Maximum number of results to return (default: 20)
 * @param offset - Number of results to skip for pagination (default: 0)
 * @returns Array of matching public Loadout objects
 *
 * @example
 * // Find all public loadouts with "ranger" in the name
 * const loadouts = await searchPublicLoadouts("ranger", 10, 0);
 */
export async function searchPublicLoadouts(
    query: string,
    limit: number = 20,
    offset: number = 0
): Promise<Loadout[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("loadouts")
        .select("*")
        .eq("is_public", true)
        .ilike("name", `%${query}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (error || !data) {
        console.error("Error searching public loadouts:", error)
        return []
    }

    return data.map(dbToLoadout)
}

/**
 * Adds a loadout to the user's favorites.
 * Creates a new entry in the favorites table linking the user and loadout.
 *
 * @param loadoutId - UUID of the loadout to favorite
 * @param userId - UUID of the user favoriting the loadout
 * @returns true if successful, false if error occurred (e.g., already favorited)
 */
export async function addToFavorites(
    loadoutId: string,
    userId: string
): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        loadout_id: loadoutId,
    })

    if (error) {
        console.error("Error adding to favorites:", error)
        return false
    }

    return true
}

/**
 * Removes a loadout from the user's favorites.
 * Deletes the favorites table entry for this user-loadout pair.
 *
 * @param loadoutId - UUID of the loadout to unfavorite
 * @param userId - UUID of the user unfavoriting the loadout
 * @returns true if successful, false if error occurred
 */
export async function removeFromFavorites(
    loadoutId: string,
    userId: string
): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("loadout_id", loadoutId)

    if (error) {
        console.error("Error removing from favorites:", error)
        return false
    }

    return true
}

/**
 * Checks if a loadout is in the user's favorites.
 *
 * @param loadoutId - UUID of the loadout to check
 * @param userId - UUID of the user
 * @returns true if favorited, false otherwise
 */
export async function isFavorited(
    loadoutId: string,
    userId: string
): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("loadout_id", loadoutId)
        .single()

    return !error && !!data
}

/**
 * Retrieves all loadouts favorited by a user.
 * Results are ordered by when they were favorited (newest first).
 *
 * @param userId - UUID of the user whose favorites to fetch
 * @returns Array of favorited Loadout objects
 */
export async function getFavoriteLoadouts(userId: string): Promise<Loadout[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("favorites")
        .select("loadout_id, loadouts(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error || !data) {
        console.error("Error fetching favorite loadouts:", error)
        return []
    }

    return data
        .filter((item: any) => item.loadouts)
        .map((item: any) => dbToLoadout(item.loadouts))
}

/**
 * Updates an existing loadout with new values.
 * Only updates fields that are provided in the input (partial update).
 *
 * @param id - UUID of the loadout to update
 * @param input - Partial loadout data with fields to update
 * @returns Updated Loadout object, or null if update failed
 *
 * @example
 * // Update only the name and description
 * await updateLoadout(loadoutId, {
 *   name: "New Name",
 *   description: "Updated description"
 * });
 */
export async function updateLoadout(
    id: string,
    input: Partial<CreateLoadoutInput>
): Promise<Loadout | null> {
    const supabase = await createClient()

    const updateData: any = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined)
        updateData.description = input.description
    if (input.targetBoss !== undefined)
        updateData.target_boss = input.targetBoss
    if (input.helmet !== undefined) updateData.helmet = input.helmet
    if (input.chest !== undefined) updateData.chest = input.chest
    if (input.legs !== undefined) updateData.legs = input.legs
    if (input.accessories !== undefined)
        updateData.accessories = input.accessories
    if (input.weapons !== undefined) updateData.weapons = input.weapons
    if (input.buffs !== undefined) updateData.buffs = input.buffs
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic

    const { data, error } = await supabase
        .from("loadouts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
        console.error("Error updating loadout:", error)
        return null
    }

    return dbToLoadout(data)
}

/**
 * Deletes a loadout from the database.
 * This will also remove all associated favorites and other related data.
 *
 * @param id - UUID of the loadout to delete
 * @returns true if successful, false if error occurred
 */
export async function deleteLoadout(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase.from("loadouts").delete().eq("id", id)

    if (error) {
        console.error("Error deleting loadout:", error)
        return false
    }

    return true
}
