/**
 * Authentication Button Component
 *
 * Displays authentication status and provides login/signup buttons or logout functionality.
 * Automatically updates when user authentication state changes.
 *
 * @component
 * @example
 * // In a header or navigation component
 * <AuthButton />
 */

"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogoutButton } from "./logout-button"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

/**
 * AuthButton component that shows login/signup buttons when logged out,
 * or user email and logout button when logged in.
 *
 * Uses Supabase auth state listener to automatically update on login/logout.
 */
export function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

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
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className='flex gap-2'>
                <Button size='sm' variant='outline' disabled>
                    Sign in
                </Button>
                <Button size='sm' variant='default' disabled>
                    Sign up
                </Button>
            </div>
        )
    }

    return user ? (
        <div className='flex items-center gap-4'>
            <span className='text-sm'>Hey, {user.email}!</span>
            <LogoutButton />
        </div>
    ) : (
        <div className='flex gap-2'>
            <Button asChild size='sm' variant='outline'>
                <Link href='/auth/login'>Sign in</Link>
            </Button>
            <Button asChild size='sm' variant='default'>
                <Link href='/auth/sign-up'>Sign up</Link>
            </Button>
        </div>
    )
}
