"use client"

import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

export function SiteHeader() {
    const [user, setUser] = useState<User | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <nav className='w-full border-b border-b-foreground/10'>
            <div className='max-w-7xl mx-auto p-4 px-6'>
                <div className='flex justify-between items-center'>
                    <Link href='/' className='text-lg sm:text-xl font-bold'>
                        🎮 Terraria Loadout Maker
                    </Link>

                    {/* Desktop Navigation */}
                    <div className='hidden lg:flex gap-8 items-center'>
                        <div className='flex gap-4 text-sm'>
                            <Link
                                href='/loadouts/create'
                                className='hover:underline whitespace-nowrap'>
                                Create Loadout
                            </Link>
                            <Link
                                href='/loadouts'
                                className='hover:underline whitespace-nowrap'>
                                Browse Loadouts
                            </Link>
                            <Link
                                href='/collections'
                                className='hover:underline whitespace-nowrap'>
                                Browse Collections
                            </Link>
                            {user && (
                                <>
                                    <Link
                                        href='/my-loadouts'
                                        className='hover:underline whitespace-nowrap'>
                                        My Loadouts
                                    </Link>
                                    <Link
                                        href='/my-collections'
                                        className='hover:underline whitespace-nowrap'>
                                        My Collections
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className='flex gap-4 items-center'>
                            <UserMenu />
                            <ThemeSwitcher />
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className='flex lg:hidden gap-2 items-center'>
                        <ThemeSwitcher />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className='p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors'
                            aria-label='Toggle menu'>
                            <svg
                                className='w-6 h-6'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'>
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                ) : (
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M4 6h16M4 12h16M4 18h16'
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className='lg:hidden mt-4 py-4 border-t border-foreground/10'>
                        <div className='flex flex-col gap-3 text-sm'>
                            <Link
                                href='/loadouts/create'
                                className='hover:underline py-2'
                                onClick={() => setIsMenuOpen(false)}>
                                Create Loadout
                            </Link>
                            <Link
                                href='/loadouts'
                                className='hover:underline py-2'
                                onClick={() => setIsMenuOpen(false)}>
                                Browse Loadouts
                            </Link>
                            <Link
                                href='/collections'
                                className='hover:underline py-2'
                                onClick={() => setIsMenuOpen(false)}>
                                Browse Collections
                            </Link>
                            {user && (
                                <>
                                    <Link
                                        href='/my-loadouts'
                                        className='hover:underline py-2'
                                        onClick={() => setIsMenuOpen(false)}>
                                        My Loadouts
                                    </Link>
                                    <Link
                                        href='/my-collections'
                                        className='hover:underline py-2'
                                        onClick={() => setIsMenuOpen(false)}>
                                        My Collections
                                    </Link>
                                </>
                            )}
                            <div className='pt-3 border-t border-foreground/10'>
                                <UserMenu />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
