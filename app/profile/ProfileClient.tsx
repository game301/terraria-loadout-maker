"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserStats {
    total_loadouts: number
    total_views: number
    total_favorites: number
    total_vote_score: number
}

export default function ProfileClient({ user }: { user: User }) {
    const router = useRouter()
    const [username, setUsername] = useState(
        user.user_metadata?.username || user.email?.split("@")[0] || ""
    )
    const [isUpdating, setIsUpdating] = useState(false)
    const [message, setMessage] = useState("")
    const [stats, setStats] = useState<UserStats | null>(null)

    // Fetch user statistics
    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient()
            const { data, error } = await supabase.rpc("get_user_stats", {
                user_id_param: user.id,
            })

            if (!error && data) {
                setStats(data)
            }
        }
        fetchStats()
    }, [user.id])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        setMessage("")

        const supabase = createClient()

        try {
            // Validate username
            if (username.trim().length < 3) {
                setMessage("Username must be at least 3 characters long")
                setIsUpdating(false)
                return
            }

            // Check if username is already taken (case-insensitive)
            const { data: usernameExists, error: checkError } =
                await supabase.rpc("check_username_exists", {
                    search_username: username,
                })

            if (checkError) {
                console.warn("Username uniqueness check failed:", checkError)
                // Continue anyway if the function doesn't exist yet
            } else if (usernameExists) {
                setMessage("Username already taken. Please choose another.")
                setIsUpdating(false)
                return
            }

            const { error } = await supabase.auth.updateUser({
                data: { username },
            })

            if (error) throw error

            setMessage("Profile updated successfully!")
            setTimeout(() => {
                router.refresh()
            }, 1000)
        } catch (error) {
            console.error("Error updating profile:", error)
            setMessage("Failed to update profile. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className='max-w-2xl mx-auto w-full p-6'>
            <div className='mb-6'>
                <h1 className='text-3xl font-bold text-foreground mb-2'>
                    Edit Profile
                </h1>
                <p className='text-gray-400'>Update your profile information</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <div className='text-2xl font-bold text-cyan-400'>
                            {stats.total_loadouts}
                        </div>
                        <div className='text-xs text-gray-400 uppercase tracking-wide mt-1'>
                            Loadouts
                        </div>
                    </div>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <div className='text-2xl font-bold text-purple-400'>
                            {stats.total_views.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-400 uppercase tracking-wide mt-1'>
                            Total Views
                        </div>
                    </div>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <div className='text-2xl font-bold text-yellow-400'>
                            {stats.total_favorites}
                        </div>
                        <div className='text-xs text-gray-400 uppercase tracking-wide mt-1'>
                            Favorites
                        </div>
                    </div>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-4'>
                        <div
                            className={`text-2xl font-bold ${
                                stats.total_vote_score > 0
                                    ? "text-green-400"
                                    : stats.total_vote_score < 0
                                    ? "text-red-400"
                                    : "text-gray-400"
                            }`}>
                            {stats.total_vote_score > 0 ? "+" : ""}
                            {stats.total_vote_score}
                        </div>
                        <div className='text-xs text-gray-400 uppercase tracking-wide mt-1'>
                            Net Votes
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6'>
                <form onSubmit={handleUpdateProfile} className='space-y-6'>
                    {/* Email (read-only) */}
                    <div>
                        <label className='block text-sm font-medium text-gray-400 mb-2'>
                            Email
                        </label>
                        <input
                            type='email'
                            value={user.email}
                            disabled
                            className='w-full px-4 py-2 bg-gray-200 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed'
                        />
                        <p className='text-xs text-gray-500 mt-1'>
                            Email cannot be changed
                        </p>
                    </div>

                    {/* Username */}
                    <div>
                        <label
                            htmlFor='username'
                            className='block text-sm font-medium text-gray-400 mb-2'>
                            Username
                        </label>
                        <input
                            id='username'
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder='Enter your username'
                            className='w-full px-4 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors'
                            required
                        />
                    </div>

                    {/* Message */}
                    {message && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                message.includes("success")
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-400 dark:border-green-700"
                                    : "bg-red-900/30 text-red-400 border border-red-700"
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className='flex gap-3'>
                        <button
                            type='submit'
                            disabled={isUpdating}
                            className='px-6 py-2 bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 border-2 border-cyan-400 disabled:border-gray-500 rounded-lg font-semibold text-foreground transition-all disabled:cursor-not-allowed'>
                            {isUpdating ? "Updating..." : "Save Changes"}
                        </button>
                        <button
                            type='button'
                            onClick={() => router.back()}
                            className='px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-gray-400 hover:border-gray-500 dark:border-gray-600 dark:hover:border-gray-500 rounded-lg font-semibold text-foreground transition-all'>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
