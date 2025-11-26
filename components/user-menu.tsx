"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function UserMenu() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            // Refresh the page to update server components
            router.refresh()
        })

        return () => subscription.unsubscribe()
    }, [router])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/auth/login")
        setIsOpen(false)
    }

    if (loading) {
        return (
            <div className='flex gap-2'>
                <Link
                    href='/auth/login'
                    className='px-3 py-1.5 text-sm border border-gray-600 rounded hover:bg-gray-700 transition'>
                    Sign in
                </Link>
                <Link
                    href='/auth/sign-up'
                    className='px-3 py-1.5 text-sm bg-blue-600 text-foreground rounded hover:bg-blue-700 transition'>
                    Sign up
                </Link>
            </div>
        )
    }

    if (!user) {
        return (
            <div className='flex gap-2'>
                <Link
                    href='/auth/login'
                    className='px-3 py-1.5 text-sm border border-gray-600 rounded hover:bg-gray-700 transition'>
                    Sign in
                </Link>
                <Link
                    href='/auth/sign-up'
                    className='px-3 py-1.5 text-sm bg-blue-600 text-foreground rounded hover:bg-blue-700 transition'>
                    Sign up
                </Link>
            </div>
        )
    }

    const username =
        user.user_metadata?.username || user.email?.split("@")[0] || "User"

    return (
        <div className='relative' ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors'>
                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-foreground font-bold text-sm'>
                    {username.charAt(0).toUpperCase()}
                </div>
                <span className='text-sm font-medium'>{username}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path d='M19 9l-7 7-7-7'></path>
                </svg>
            </button>

            {isOpen && (
                <div className='absolute right-0 mt-2 w-56 card-dark border-2 border-dark rounded-lg shadow-xl overflow-hidden z-50'>
                    {/* User Info */}
                    <div className='px-4 py-3 border-b border-dark'>
                        <div className='text-sm font-medium text-foreground'>
                            {username}
                        </div>
                        <div className='text-xs text-gray-400 truncate'>
                            {user.email}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className='py-1'>
                        <Link
                            href='/profile'
                            onClick={() => setIsOpen(false)}
                            className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors'>
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'></path>
                            </svg>
                            Edit Profile
                        </Link>

                        <Link
                            href='/my-loadouts'
                            onClick={() => setIsOpen(false)}
                            className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors'>
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'></path>
                            </svg>
                            My Loadouts
                        </Link>

                        <Link
                            href='/my-collections'
                            onClick={() => setIsOpen(false)}
                            className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors'>
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'></path>
                            </svg>
                            My Collections
                        </Link>

                        <Link
                            href='/favorites'
                            onClick={() => setIsOpen(false)}
                            className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors'>
                            <svg
                                className='w-4 h-4'
                                fill='currentColor'
                                viewBox='0 0 20 20'>
                                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'></path>
                            </svg>
                            Favorites
                        </Link>
                    </div>

                    {/* Sign Out */}
                    <div className='border-t border-dark py-1'>
                        <button
                            onClick={handleSignOut}
                            className='flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors w-full text-left'>
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'></path>
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
