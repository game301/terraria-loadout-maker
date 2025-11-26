import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
    const supabase = await createClient()

    // Get some stats
    const { count: loadoutCount } = await supabase
        .from("loadouts")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)

    const { data: recentLoadouts } = await supabase
        .from("loadouts")
        .select("id, name, game_mode, view_count, vote_score, creator_username")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(3)

    return (
        <div className='min-h-screen terraria-bg'>
            {/* Hero Section */}
            <div className='relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent'></div>
                <div className='max-w-7xl mx-auto px-6 py-20 relative'>
                    <div className='text-center space-y-6 mb-16'>
                        <h1 className='text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-pulse'>
                            Terraria Loadout Maker
                        </h1>
                        <p className='text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto'>
                            Create, share, and discover the perfect equipment
                            builds for every boss, progression stage, and
                            playstyle. Full support for Vanilla, Calamity, and
                            Thorium mods.
                        </p>
                        <div className='flex flex-col sm:flex-row gap-4 justify-center mt-8'>
                            <Link
                                href='/loadouts/create'
                                className='group px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-foreground text-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-900/50 flex items-center justify-center gap-2'>
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'>
                                    <path d='M12 4v16m8-8H4'></path>
                                </svg>
                                Create Loadout
                            </Link>
                            <Link
                                href='/loadouts'
                                className='px-8 py-4 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-foreground text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2'>
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'>
                                    <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                                </svg>
                                Browse Loadouts
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    {loadoutCount && loadoutCount > 0 && (
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16'>
                            <div className='card-dark border-2 border-cyan-500/50 rounded-lg p-6 text-center transform hover:scale-105 transition-transform'>
                                <div className='text-4xl font-bold text-cyan-400 mb-2'>
                                    {loadoutCount.toLocaleString()}
                                </div>
                                <div className='text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide'>
                                    Public Loadouts
                                </div>
                            </div>
                            <div className='card-dark border-2 border-purple-500/50 rounded-lg p-6 text-center transform hover:scale-105 transition-transform'>
                                <div className='text-4xl font-bold text-purple-400 mb-2'>
                                    3
                                </div>
                                <div className='text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide'>
                                    Supported Mods
                                </div>
                            </div>
                            <div className='card-dark border-2 border-yellow-500/50 rounded-lg p-6 text-center transform hover:scale-105 transition-transform'>
                                <div className='text-4xl font-bold text-yellow-400 mb-2'>
                                    Free
                                </div>
                                <div className='text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide'>
                                    Always & Forever
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Features Section */}
            <div className='max-w-7xl mx-auto px-6 py-16'>
                <h2 className='text-4xl font-bold text-center text-yellow-400 mb-12'>
                    Features
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-cyan-500 transition-colors'>
                        <div className='w-12 h-12 bg-cyan-500 dark:bg-cyan-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Complete Loadouts
                        </h3>
                        <p className='text-gray-400'>
                            Create full builds with armor, weapons, accessories,
                            and buffs. Everything you need in one place.
                        </p>
                    </div>

                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-purple-500 transition-colors'>
                        <div className='w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Smart Tags
                        </h3>
                        <p className='text-gray-400'>
                            Organize with tags like "Pre-Hardmode", "Mage
                            Build", or "Boss Rush". Find what you need
                            instantly.
                        </p>
                    </div>

                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-green-500 transition-colors'>
                        <div className='w-12 h-12 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Share & Discover
                        </h3>
                        <p className='text-gray-400'>
                            Share your builds with the community. Vote on
                            favorites and discover top-rated loadouts.
                        </p>
                    </div>

                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-yellow-500 transition-colors'>
                        <div className='w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Mod Support
                        </h3>
                        <p className='text-gray-400'>
                            Full support for Vanilla, Calamity, and Thorium.
                            Create builds for any playstyle.
                        </p>
                    </div>

                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-blue-500 transition-colors'>
                        <div className='w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Collections
                        </h3>
                        <p className='text-gray-400'>
                            Group your loadouts into collections. Perfect for
                            progression guides or themed builds.
                        </p>
                    </div>

                    <div className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-red-500 transition-colors'>
                        <div className='w-12 h-12 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-white'
                                fill='currentColor'
                                viewBox='0 0 20 20'>
                                <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'></path>
                                <path
                                    fillRule='evenodd'
                                    d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
                                    clipRule='evenodd'></path>
                            </svg>
                        </div>
                        <h3 className='text-xl font-bold text-foreground mb-2'>
                            Track Stats
                        </h3>
                        <p className='text-gray-400'>
                            See views, votes, and favorites. Track your most
                            popular builds and contributions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Loadouts */}
            {recentLoadouts && recentLoadouts.length > 0 && (
                <div className='max-w-7xl mx-auto px-6 py-16'>
                    <div className='flex justify-between items-center mb-8'>
                        <h2 className='text-4xl font-bold text-yellow-400'>
                            Recent Loadouts
                        </h2>
                        <Link
                            href='/loadouts'
                            className='text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2'>
                            View All
                            <svg
                                className='w-5 h-5'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'>
                                <path d='M9 5l7 7-7 7'></path>
                            </svg>
                        </Link>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {recentLoadouts.map((loadout) => (
                            <Link
                                key={loadout.id}
                                href={`/loadouts/${loadout.id}`}
                                className='bg-gradient-to-b card-dark border-2 border-dark rounded-lg p-6 hover:border-cyan-500 transition-all transform hover:scale-105'>
                                <h3 className='text-xl font-bold text-foreground mb-2 truncate'>
                                    {loadout.name}
                                </h3>
                                <div className='flex items-center justify-between text-sm mb-4'>
                                    <span className='text-gray-400 capitalize'>
                                        {loadout.game_mode}
                                    </span>
                                    <span className='text-cyan-400'>
                                        {loadout.creator_username ||
                                            "Anonymous"}
                                    </span>
                                </div>
                                <div className='flex gap-4 text-sm text-gray-400'>
                                    {loadout.view_count > 0 && (
                                        <span className='flex items-center gap-1'>
                                            <svg
                                                className='w-4 h-4'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'>
                                                <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'></path>
                                                <path
                                                    fillRule='evenodd'
                                                    d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
                                                    clipRule='evenodd'></path>
                                            </svg>
                                            {loadout.view_count}
                                        </span>
                                    )}
                                    {loadout.vote_score !== 0 && (
                                        <span
                                            className={`flex items-center gap-1 ${
                                                loadout.vote_score > 0
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }`}>
                                            {loadout.vote_score > 0
                                                ? "👍"
                                                : "👎"}{" "}
                                            {Math.abs(loadout.vote_score)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <div className='bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 py-16'>
                <div className='max-w-4xl mx-auto text-center px-6'>
                    <h2 className='text-4xl font-bold text-foreground mb-4'>
                        Ready to Build?
                    </h2>
                    <p className='text-xl text-gray-700 dark:text-gray-300 mb-8'>
                        Join the community and start creating your perfect
                        Terraria loadouts today
                    </p>
                    <Link
                        href='/auth/sign-up'
                        className='inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-foreground text-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-900/50'>
                        Sign Up Free
                    </Link>
                </div>
            </div>
        </div>
    )
}
