# Terraria Loadout Maker

A modern web application for creating, sharing, and discovering Terraria character loadouts. Build your perfect equipment setup for any boss fight and share it with the community!

## ✨ Features

-   🎮 **Loadout Builder** - Create custom loadouts with armor, weapons, accessories, and buffs
-   🌐 **Community Sharing** - Publish loadouts and browse builds from other players
-   💾 **Save & Organize** - Keep your builds organized in personal collections
-   ⭐ **Favorites** - Bookmark loadouts you want to try
-   🔍 **Search & Filter** - Find loadouts by boss, class, or game mode
-   🎨 **Mod Support** - Works with Vanilla, Calamity, and Thorium Mod content
-   🔐 **Authentication** - Secure user accounts via Supabase

## 🚀 Getting Started

### Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

### Detailed Setup Guide

For complete setup instructions including:

-   Prerequisites and installation
-   Environment configuration
-   Database setup
-   Testing setup
-   Troubleshooting

**See [SETUP.md](SETUP.md)** for the full guide.

### Prerequisites

-   Node.js 18 or higher
-   pnpm (this project uses pnpm exclusively)
-   A Supabase account ([create one free](https://database.new))

## 📖 Documentation

-   **[Setup Guide](SETUP.md)** - Complete installation and setup instructions
-   **[Database Setup](DATABASE_SETUP.md)** - Database schema and configuration
-   **[Developer Guide](DEVELOPER_GUIDE.md)** - Comprehensive guide for developers
-   **[Data Structure](DATA_STRUCTURE.md)** - Data file specifications and conventions
-   **[Quick Reference](QUICK_REFERENCE.md)** - Command cheat sheet
-   **[Wiki Scrapers](scripts/scrapers/README.md)** - Automated wiki scraping documentation

## 🏗️ Technology Stack

-   **Framework**: Next.js 15 (App Router with Turbopack)
-   **Language**: TypeScript 5
-   **Styling**: Tailwind CSS with custom Terraria theme
-   **UI Components**: shadcn/ui (Radix UI primitives)
-   **Database**: Supabase (PostgreSQL with RLS)
-   **Authentication**: Supabase Auth
-   **Testing**: Jest (unit tests) & Playwright (E2E tests)
-   **Web Scraping**: Cheerio (HTML parsing)
-   **Image CDN**: Terraria Wiki & Mod Wikis

## 📊 Data Structure

Terraria Loadout Maker uses a **hybrid data approach**:

### Static Data (JSON Files)

-   **Items** (`data/items-{mod}.json`) - 3,322 items across 3 mods (1,077 vanilla + 1,078 Calamity + 1,167 Thorium)
-   **Bosses** (`data/bosses-{mod}.json`) - 55 bosses with progression info (18 vanilla + 26 Calamity + 11 Thorium)
-   **Buffs** (`data/buffs-{mod}.json`) - Potions and buff items
-   **Ammunition** (`data/ammunition-{mod}.json`) - Ammunition types

Items use non-overlapping ID ranges:

-   Vanilla: 1 - 99,999
-   Calamity: 100,000 - 199,999
-   Thorium: 200,000 - 299,999

### Dynamic Data (Supabase)

-   **Loadouts** - User-created builds with equipment and metadata
-   **Collections** - Organized groups of loadouts
-   **Favorites** - User bookmarks of public loadouts
-   **User Profiles** - Account information and preferences

## 🛠️ Development

### Build Commands

```bash
# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# TypeScript type checking
pnpm tsc --noEmit
```

### Testing

```bash
# Run unit tests (Jest)
pnpm test

# Run E2E tests (Playwright)
pnpm test:e2e

# Run specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Data Generation Scripts

```bash
# Manual item generation (curated items)
pnpm generate-vanilla-items  # Generate vanilla Terraria items
pnpm generate-mod-items      # Generate Calamity & Thorium mod items

# Wiki scraping (comprehensive item extraction)
pnpm scrape:all       # Scrape all wikis (vanilla, calamity, thorium)
pnpm scrape:vanilla   # Scrape vanilla Terraria wiki only
pnpm scrape:calamity  # Scrape Calamity mod wiki only
pnpm scrape:thorium   # Scrape Thorium mod wiki only
```

**Note**: Scraped data is saved with `-scraped` suffix for manual review before use.

## 🎯 Roadmap

### ✅ Completed

-   [x] Unit tests (Jest) - 37/37 passing
-   [x] End-to-end tests (Playwright) - 30/30 passing on 3 browsers
-   [x] Loadout voting/rating system
-   [x] Dark mode support

### 🚧 Future Enhancements

-   [ ] Equipment comparison tool
-   [ ] DPS calculator
-   [ ] Social features (follows, notifications)
-   [ ] Mobile app (React Native)
-   [ ] API for external tools

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow existing code patterns and add JSDoc comments
4. Test your changes locally (`pnpm build`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for detailed contribution guidelines.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

-   [Terraria Wiki](https://terraria.wiki.gg) - Item sprites and data
-   [Calamity Mod Wiki](https://calamitymod.wiki.gg) - Mod content
-   [Thorium Mod Wiki](https://thoriummod.wiki.gg) - Mod content
-   [Re-Logic](https://re-logic.com) - Terraria game creators
-   [shadcn/ui](https://ui.shadcn.com) - UI component library

## 📧 Contact

Project Link: [https://github.com/yourusername/terraria-loadout-maker](https://github.com/yourusername/terraria-loadout-maker)

---

Made with ❤️ by the Terraria community
