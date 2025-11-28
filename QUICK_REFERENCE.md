# Quick Reference Guide

Quick reference for common tasks and patterns in Terraria Loadout Maker.

> **First time here?** Check [SETUP.md](SETUP.md) for installation and [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for comprehensive docs.

## 🚀 Quick Start Commands

```bash
# Install dependencies (use pnpm only!)
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Scrape wiki data
pnpm scrape:all       # All wikis
pnpm scrape:calamity  # Calamity only
```

## 📂 File Locations

| What             | Where                      |
| ---------------- | -------------------------- |
| Item data        | `data/items-{mod}.json`    |
| Boss data        | `data/bosses-{mod}.json`   |
| Wiki scrapers    | `scripts/scrapers/`        |
| Pages            | `app/{route}/page.tsx`     |
| Components       | `components/`              |
| Utilities        | `lib/`                     |
| Types            | `lib/terraria/types.ts`    |
| Image helpers    | `lib/terraria/images.ts`   |
| Database helpers | `lib/terraria/loadouts.ts` |

## 🎨 Data Conventions

### Item IDs by Mod

-   Vanilla: `1 - 99,999`
-   Calamity: `100,000 - 199,999`
-   Thorium: `200,000 - 299,999`

### File Naming

-   Pattern: `{category}-{mod}.json`
-   Examples: `items-vanilla.json`, `bosses-calamity.json`

### Required Item Fields

```typescript
{
  id: number,           // Unique ID in mod range
  name: string,         // Display name
  type: string,         // "weapon" | "armor" | "accessory" etc.
  rarity: number,       // 0-11+
  mod?: string          // "vanilla" | "calamity" | "thorium"
}
```

## 💡 Common Code Patterns

### Loading Data

```typescript
import vanillaItems from "@/data/items-vanilla.json"
import calamityItems from "@/data/items-calamity.json"
import thoriumItems from "@/data/items-thorium.json"

const allItems = [...vanillaItems, ...calamityItems, ...thoriumItems]
```

### Getting Item Image

```typescript
import { getItemImageUrl, handleImageError } from "@/lib/terraria/images"
;<img
    src={getItemImageUrl(item.name, item.mod)}
    onError={(e) => handleImageError(e, item.name, item.mod)}
    alt={item.name}
/>
```

### Checking Authentication (Server)

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login")

    // Page content
}
```

### Checking Authentication (Client)

```typescript
"use client"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function MyComponent() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })
    }, [])

    // Component logic
}
```

### Database Operations

```typescript
import {
    createLoadout,
    getUserLoadouts,
    getPublicLoadouts,
} from "@/lib/terraria/loadouts"

// Create loadout
const loadout = await createLoadout(
    {
        name: "My Build",
        isPublic: true,
    },
    userId
)

// Get user's loadouts
const myLoadouts = await getUserLoadouts(userId)

// Get public loadouts (paginated)
const publicLoadouts = await getPublicLoadouts(20, 0)
```

## 🔧 Data Generation Scripts

```bash
# Fetch Calamity and Thorium items
pnpm tsx scripts/fetch-mod-items.ts

# Generate vanilla items
pnpm tsx scripts/generate-vanilla-items.ts

# Update boss data
pnpm tsx scripts/update-boss-data.ts
```

## 🎯 Rarity Colors

| Rarity | Color   | Name         |
| ------ | ------- | ------------ |
| -1     | #828282 | Gray         |
| 0      | #FFFFFF | White        |
| 1      | #9696FF | Blue         |
| 2      | #96FF96 | Green        |
| 3      | #FF9696 | Orange       |
| 4      | #FF9696 | Light Red    |
| 5      | #FF96FF | Pink         |
| 6      | #D896FF | Light Purple |
| 7      | #96FF96 | Lime         |
| 8      | #FFFF96 | Yellow       |
| 9      | #96FFFF | Cyan         |
| 10     | #FF6464 | Red          |
| 11     | #FF00FF | Purple       |
| 12+    | #FFD700 | Rainbow      |

Use `getRarityColor(rarity)` function in components.

## 📝 Adding New Content

### Add New Item

1. Edit `data/items-{mod}.json`
2. Ensure ID is in correct range for mod
3. Include required fields: id, name, type, rarity, mod
4. Add image override if needed in `lib/terraria/images.ts`

### Add New Boss

1. Edit `data/bosses-{mod}.json`
2. Ensure ID is in correct range
3. Set progression and order values
4. Add icon override if needed in `lib/terraria/images.ts`

### Add New Page

1. Create `app/{route}/page.tsx`
2. Export default function (Server) or use `"use client"`
3. Follow existing patterns

## 🐛 Debugging

### Images Not Loading

1. Check mod value: "vanilla", "calamity", or "thorium"
2. Verify item name matches wiki format
3. Check browser console for 404s
4. Add override in `lib/terraria/images.ts`

### Build Errors

```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Check linting
pnpm lint

# Verify environment variables
cat .env.local
```

### Authentication Issues

1. Verify Supabase URL and anon key
2. Check email confirmation in Supabase dashboard
3. Verify RLS policies allow user access
4. Clear cookies and try again

## 📚 Documentation

| Document             | Purpose                 |
| -------------------- | ----------------------- |
| `README.md`          | User-friendly overview  |
| `DEVELOPER_GUIDE.md` | Comprehensive dev guide |
| `DATA_STRUCTURE.md`  | Data specifications     |
| `scripts/README.md`  | Script usage            |

## 🔗 Useful Links

-   [Next.js Docs](https://nextjs.org/docs)
-   [Supabase Docs](https://supabase.com/docs)
-   [Tailwind CSS](https://tailwindcss.com/docs)
-   [shadcn/ui](https://ui.shadcn.com)
-   [Terraria Wiki](https://terraria.wiki.gg)
-   [Calamity Wiki](https://calamitymod.wiki.gg)
-   [Thorium Wiki](https://thoriummod.wiki.gg)

## 🎓 Key Concepts

### Server vs Client Components

-   **Server** (default): Fetch on server, better SEO, no JavaScript
-   **Client** (`"use client"`): Interactivity, hooks, browser APIs

### Data Flow

1. Static JSON files loaded at build time
2. Combined into arrays at runtime
3. Filtered/sorted in components
4. User loadouts stored in Supabase

### Authentication Flow

1. Sign up → Email confirmation → Login
2. Session stored in cookies
3. Access control via RLS policies
4. Auth state managed by Supabase

---

**Need more details?** Check `DEVELOPER_GUIDE.md`
