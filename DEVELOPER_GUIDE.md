# Developer Guide - Terraria Loadout Maker

## Overview

Terraria Loadout Maker is a Next.js application for creating, sharing, and discovering Terraria character loadouts. Users can build loadouts with armor, weapons, accessories, and buffs, then share them with the community.

> **New to the project?** See [SETUP.md](SETUP.md) for complete installation and setup instructions.

## Technology Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Database**: Supabase (PostgreSQL)
-   **Authentication**: Supabase Auth
-   **Package Manager**: pnpm (exclusively - do not use npm or yarn)

## Project Structure

```
terraria-loadout-maker/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login, signup, etc.)
│   ├── collections/       # Browse public collections
│   ├── favorites/         # User's favorited loadouts
│   ├── loadouts/          # Browse public loadouts & create new
│   ├── my-collections/    # User's private collections
│   ├── my-loadouts/       # User's loadouts with edit functionality
│   ├── profile/           # User profile management
│   └── users/             # Public user profiles
├── components/            # React components
│   ├── ui/               # shadcn/ui components (button, card, etc.)
│   └── terraria/         # Terraria-specific components
├── data/                  # Static JSON data files
│   ├── items-{mod}.json  # Item databases by mod
│   ├── bosses-{mod}.json # Boss databases by mod
│   ├── buffs-{mod}.json  # Buff/potion databases
│   └── ammo-{mod}.json   # Ammunition databases
├── lib/                   # Utility functions and shared logic
│   ├── supabase/         # Database client configuration
│   ├── terraria/         # Terraria-specific utilities
│   └── utils.ts          # General utility functions
├── public/                # Static assets
│   └── terraria/         # Terraria sprites and icons
└── scripts/               # Data generation scripts
```

## Data Structure

### Naming Convention

All data files follow the pattern: `{category}-{mod}.json`

**Examples:**

-   `items-vanilla.json` - Vanilla Terraria items
-   `items-calamity.json` - Calamity Mod items
-   `bosses-thorium.json` - Thorium Mod bosses

### ID System

Items and bosses use non-overlapping ID ranges by mod to prevent conflicts:

| Mod      | ID Range          |
| -------- | ----------------- |
| Vanilla  | 1 - 99,999        |
| Calamity | 100,000 - 199,999 |
| Thorium  | 200,000 - 299,999 |

**Example:**

```json
{
  "id": 3507,           // Vanilla item
  "name": "Terra Blade",
  "mod": "vanilla"
}

{
  "id": 100089,         // Calamity item
  "name": "Drataliornus",
  "mod": "calamity"
}
```

### Item Schema

```typescript
interface TerrariaItem {
    id: number // Unique ID in mod-specific range
    name: string // Display name
    type: ItemType // "weapon" | "armor" | "accessory" | etc.
    rarity: number // 0-11+ (affects color coding)
    mod?: string // "vanilla" | "calamity" | "thorium"

    // Optional fields based on type
    defense?: number // Armor only
    damage?: number // Weapons only
    armorType?: string // "helmet" | "chestplate" | "leggings"
    weaponClass?: string // "melee" | "ranged" | "magic" | "summoner"
    tooltip?: string // Hover description
}
```

### Boss Schema

```typescript
interface TerrariaBoss {
    id: number // Unique ID in mod-specific range
    name: string // Display name
    mod?: string // "vanilla" | "calamity" | "thorium"
    progression: string // "pre-hardmode" | "hardmode" | etc.
    order: number // Sequential boss order (1, 2, 3...)

    // NOTE: health and defense removed to reduce data size
}
```

## Key Modules

### Image Utilities (`lib/terraria/images.ts`)

Centralized functions for fetching Terraria wiki images with multiple fallback strategies.

**Functions:**

-   `getBossImageUrl(bossName, mod?)` - Get boss icon URL with overrides
-   `getItemImageUrl(itemName, mod?)` - Get item sprite URL with overrides
-   `handleImageError(event, itemName, mod?, size?)` - 4-attempt fallback system
-   `getTextFallbackImage(text, size?)` - Generate SVG text fallback

**Image Fallback Strategy:**

1. Try standard wiki URL format
2. Try with `(item)` suffix
3. Try `.gif` extension instead of `.png`
4. Try lowercase version
5. Final fallback: SVG with first letter

### Loadout Utilities (`lib/terraria/loadouts.ts`)

Database operations for loadouts using Supabase.

**Key Functions:**

-   `createLoadout(input, userId)` - Create new loadout
-   `getUserLoadouts(userId)` - Get all user's loadouts
-   `getLoadoutById(id)` - Fetch specific loadout
-   `getPublicLoadouts(limit, offset)` - Paginated public loadouts
-   `searchPublicLoadouts(query, limit, offset)` - Search by name
-   `updateLoadout(id, input)` - Update existing loadout
-   `deleteLoadout(id)` - Delete loadout
-   `addToFavorites(loadoutId, userId)` - Favorite a loadout
-   `removeFromFavorites(loadoutId, userId)` - Unfavorite
-   `getFavoriteLoadouts(userId)` - Get user's favorites

**Data Transformation:**

-   Database uses `snake_case` fields
-   Application uses `camelCase` fields
-   `dbToLoadout()` function converts between formats

### Type Definitions (`lib/terraria/types.ts`)

Core TypeScript interfaces for type safety.

**Types:**

-   `ItemType` - Item categories (weapon, armor, etc.)
-   `ArmorSlot` - Equipment slots (head, chest, legs)
-   `WeaponClass` - Character classes (melee, ranged, magic, summoner)
-   `BossProgression` - Game progression stages

**Interfaces:**

-   `TerrariaItem` - Complete item data
-   `TerrariaBoss` - Boss information
-   `Loadout` - Character loadout with all equipment

## Data Management

### Loading Data in Components

Data files are imported at runtime and combined:

```typescript
import vanillaItems from "@/data/items-vanilla.json"
import calamityItems from "@/data/items-calamity.json"
import thoriumItems from "@/data/items-thorium.json"

const allItems = [...vanillaItems, ...calamityItems, ...thoriumItems]
```

### Generating Data

Use scripts to regenerate data files:

```bash
# Generate vanilla items from Terraria wiki
pnpm tsx scripts/generate-vanilla-items.ts

# Fetch Calamity and Thorium mod items
pnpm tsx scripts/fetch-mod-items.ts

# Update boss data
pnpm tsx scripts/update-boss-data.ts
```

See `scripts/README.md` for detailed script documentation.

## Authentication Flow

1. User signs up via `/auth/sign-up`
2. Supabase sends confirmation email
3. User clicks email link → redirected to `/auth/confirm`
4. Session established, user redirected to home
5. Auth state managed via `AuthButton` component

## Database Schema

### Tables

**loadouts**

-   `id` (uuid, primary key)
-   `user_id` (uuid, foreign key to auth.users)
-   `name` (text)
-   `description` (text, nullable)
-   `target_boss` (text, nullable)
-   `game_mode` (text)
-   `helmet` (jsonb, nullable)
-   `chest` (jsonb, nullable)
-   `legs` (jsonb, nullable)
-   `accessories` (jsonb array)
-   `weapons` (jsonb array)
-   `buffs` (jsonb array)
-   `is_public` (boolean)
-   `video_link` (text, nullable)
-   `version_tag` (text, nullable)
-   `view_count` (integer)
-   `created_at` (timestamp)
-   `updated_at` (timestamp)

**favorites**

-   `id` (uuid, primary key)
-   `user_id` (uuid, foreign key)
-   `loadout_id` (uuid, foreign key)
-   `created_at` (timestamp)

**collections**

-   `id` (uuid, primary key)
-   `user_id` (uuid, foreign key)
-   `name` (text)
-   `description` (text, nullable)
-   `loadout_ids` (uuid array)
-   `is_public` (boolean)
-   `created_at` (timestamp)
-   `updated_at` (timestamp)

## Development Workflow

### Running Locally

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Building for Production

```bash
# Build optimized production bundle
pnpm build

# Test production build locally
pnpm start
```

### Code Quality

```bash
# Run linter
pnpm lint

# Format code (if configured)
pnpm format
```

## Component Patterns

### Client Components

Use `"use client"` for components that need:

-   React hooks (useState, useEffect, etc.)
-   Browser APIs
-   Event handlers
-   Supabase client-side auth

```tsx
"use client"

import { useState } from "react"

export function MyComponent() {
    const [state, setState] = useState(false)
    // ...
}
```

### Server Components (Default)

Use for components that:

-   Fetch data on server
-   Don't need interactivity
-   Can be static/cached

```tsx
import { createClient } from "@/lib/supabase/server"

export default async function MyPage() {
    const supabase = await createClient()
    const { data } = await supabase.from("loadouts").select("*")
    // ...
}
```

## Common Tasks

### Adding a New Item

1. Edit appropriate data file (`data/items-{mod}.json`)
2. Ensure ID is in correct range for the mod
3. Include all required fields (id, name, type, rarity)
4. Add image override if needed in `lib/terraria/images.ts`

### Adding a New Boss

1. Edit appropriate data file (`data/bosses-{mod}.json`)
2. Ensure ID is in correct range
3. Set correct progression and order values
4. Add icon override if needed in `lib/terraria/images.ts`

### Creating a New Page

1. Create file in `app/{route}/page.tsx`
2. Export default async function (Server Component) or use `"use client"`
3. Follow naming convention: `page.tsx` for routes
4. Use layout.tsx for shared UI across route segment

### Adding Authentication to a Page

Server-side (recommended):

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Page content for authenticated users
}
```

Client-side:

```tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function ProtectedComponent() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })
    }, [])

    if (!user) return <div>Please log in</div>
    // Component content
}
```

## Performance Considerations

### Image Loading

-   All images loaded from Terraria wiki CDNs
-   Multiple fallback attempts before showing text placeholder
-   Consider adding local caching for frequently used sprites

### Data Loading

-   JSON files loaded at build time (static)
-   Combine mod-specific files at runtime (~210 items total)
-   Consider pagination for large loadout lists

### Database Queries

-   Use pagination (`limit` and `offset`) for lists
-   Index frequently queried fields (user_id, is_public)
-   Minimize RLS policy complexity for performance

## Troubleshooting

### Images Not Loading

1. Check mod value matches data ("vanilla", "calamity", "thorium")
2. Verify item name matches wiki format
3. Check browser console for 404s
4. Add override in `ITEM_NAME_OVERRIDES` if needed

### Build Errors

Common issues:

-   Missing Supabase environment variables
-   TypeScript errors - run `pnpm tsc --noEmit` to check
-   Import path issues - use `@/` for absolute imports from project root

### Authentication Issues

1. Verify Supabase URL and anon key in `.env.local`
2. Check email confirmation is enabled in Supabase project
3. Ensure RLS policies allow user to read their own data
4. Clear browser cookies and try again

## Additional Documentation

-   `DATA_STRUCTURE.md` - Detailed data file specifications
-   `DATA_RESTRUCTURING_PROGRESS.md` - Migration progress tracking
-   `scripts/README.md` - Data generation script usage
-   `CLEANUP_ROUND_2.md` - Previous cleanup summary

## Contributing

When adding new features:

1. Follow existing patterns and naming conventions
2. Update TypeScript interfaces for new data structures
3. Add JSDoc comments to new functions
4. Test locally with `pnpm dev` and `pnpm build`
5. Update relevant documentation files

## License

[Your license here]
