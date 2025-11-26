import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for use in browser/client-side code.
 * Uses environment variables for authentication.
 * @returns Configured Supabase browser client instance
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}
