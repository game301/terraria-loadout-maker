import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge.
 * Useful for conditionally applying Tailwind CSS classes while handling conflicts.
 * @param inputs - Class names, objects, or arrays of class names
 * @returns Merged class name string with Tailwind conflicts resolved
 * @example
 * cn("px-2 py-1", isActive && "bg-blue-500", "px-4") // "py-1 bg-blue-500 px-4"
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Checks if required Supabase environment variables are defined.
 * Used to verify configuration before attempting database operations.
 * @returns true if both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set
 */
export const hasEnvVars =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
