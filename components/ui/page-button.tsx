import Link from "next/link"
import { ReactNode } from "react"

interface PageButtonProps {
    href?: string
    onClick?: () => void
    children: ReactNode
    variant?: "primary" | "secondary"
    className?: string
}

export function PageButton({
    href,
    onClick,
    children,
    variant = "primary",
    className = "",
}: PageButtonProps) {
    const baseStyles =
        "px-4 py-2 rounded text-sm font-semibold transition-all whitespace-nowrap border-2"
    const variantStyles =
        variant === "primary"
            ? "bg-[hsl(var(--button-bg))] hover:bg-[hsl(var(--button-bg-hover))] border-[hsl(var(--button-border))] text-[hsl(var(--button-text))]"
            : "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 border-gray-400 dark:border-gray-500 text-white"

    const combinedClassName = `${baseStyles} ${variantStyles} ${className}`

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                {children}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={combinedClassName}>
            {children}
        </button>
    )
}
