import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import "./globals.css"

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Terraria Loadout Maker",
    description:
        "Create, save, and share your best Terraria equipment loadouts for every boss and progression stage",
}

const geistSans = Geist({
    variable: "--font-geist-sans",
    display: "swap",
    subsets: ["latin"],
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body className={`${geistSans.className} antialiased`}>
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange>
                    <div className='min-h-screen flex flex-col'>
                        <SiteHeader />
                        <div className='flex-1'>{children}</div>
                        <SiteFooter />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    )
}
