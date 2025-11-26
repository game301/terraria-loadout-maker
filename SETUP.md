# Terraria Loadout Maker - Setup Guide

Complete step-by-step setup guide for getting the Terraria Loadout Maker running on your local machine.

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

    - Download: https://nodejs.org/
    - Verify installation: `node --version`

2. **pnpm** (recommended package manager)

    ```bash
    # Install pnpm globally via npm
    npm install -g pnpm

    # Verify installation
    pnpm --version
    ```

    **Why pnpm?**

    - Faster than npm/yarn (disk space efficiency)
    - Strict dependency resolution
    - Better monorepo support
    - This project is configured for pnpm

3. **Git**
    - Download: https://git-scm.com/
    - Verify installation: `git --version`

### Required Accounts

1. **Supabase Account** (free tier available)
    - Sign up: https://database.new
    - You'll need this for authentication and database

---

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/terraria-loadout-maker.git
cd terraria-loadout-maker
```

### 2. Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install

# This will install:
# - Production dependencies (~15 packages)
# - Development dependencies (~20 packages)
# - Total: ~278 packages (including sub-dependencies)
```

**Expected output:**

```
Packages: +278
Progress: resolved 278, reused 0, downloaded 278, added 278
Done in 15s
```

### 3. Environment Variables Setup

Create a `.env.local` file in the project root:

```bash
# Copy the example file (if available)
cp .env.example .env.local

# Or create manually
touch .env.local
```

Add the following variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Enable debug mode
# NEXT_PUBLIC_DEBUG=true
```

**How to get Supabase credentials:**

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Project Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### 4. Database Setup

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open `lib/supabase/complete-setup.sql` in this project
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** to create all tables, indexes, functions, and policies

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
pnpm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the schema
supabase db push
```

**What gets created:**

-   **7 tables**: loadouts, collections, collection_items, favorites, votes, comments, profiles
-   **10+ indexes** for query performance optimization
-   **3 database functions**: get_user_stats, get_loadout_vote_score, handle_updated_at
-   **20+ RLS policies** for secure data access
-   **3 triggers** for automatic timestamp updates

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed schema documentation.

### 5. Verify Setup

Run the development server:

```bash
pnpm dev
```

**Expected output:**

```
▲ Next.js 15.0.3
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.5s
```

Open http://localhost:3000 in your browser. You should see the homepage!

---

## 🧪 Testing Setup

### Run Tests

```bash
# Run unit tests (Jest)
pnpm test

# Run E2E tests (Playwright)
pnpm test:e2e

# Run E2E on specific browser
pnpm test:e2e --project=chromium
```

**Expected output (Unit Tests):**

```
Test Suites: 2 passed, 2 total
Tests:       37 passed, 37 total
Time:        2.3s
```

**Expected output (E2E Tests):**

```
Running 30 tests using 10 workers
30 passed (29.7s)
```

### Test Files Location

-   `__tests__/integration/` - Integration tests
-   `__tests__/unit/` - Unit tests

---

## 🛠️ Development Workflow

### Common Commands

```bash
# Start development server (with hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Run ESLint
pnpm lint

# Run tests
pnpm test

# Type-check TypeScript (without building)
pnpm tsc --noEmit
```

### Data Generation Scripts

```bash
# Fetch Calamity/Thorium items from wikis
pnpm tsx scripts/fetch-mod-items.ts

# Generate vanilla items list
pnpm tsx scripts/generate-vanilla-items.ts

# Update boss data
pnpm tsx scripts/update-boss-data.ts

# Fix duplicate IDs in data files
node scripts/fix-duplicate-ids.js
```

---

## 📁 Project Structure

```
terraria-loadout-maker/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── loadouts/          # Loadout browsing/viewing
│   ├── my-loadouts/       # User's personal loadouts
│   ├── collections/       # Public collections
│   ├── my-collections/    # User's collections
│   └── favorites/         # Favorited loadouts
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── terraria/         # Terraria-specific components
├── lib/                   # Utility functions
│   ├── supabase/         # Database client & schema
│   └── terraria/         # Game data utilities
├── data/                  # Static JSON data files
│   ├── items-*.json      # Item data by mod
│   ├── bosses-*.json     # Boss data by mod
│   ├── buffs-*.json      # Buff/potion data
│   └── ammo-*.json       # Ammunition data
├── scripts/               # Data generation scripts
├── __tests__/            # Test files
│   ├── integration/      # Integration tests
│   └── unit/            # Unit tests
└── public/               # Static assets
    └── terraria/         # Game images
```

---

## 🔧 Troubleshooting

### Issue: `pnpm: command not found`

**Solution:**

```bash
# Install pnpm globally
npm install -g pnpm

# Or use npx (no installation needed)
npx pnpm install
```

### Issue: Build fails with TypeScript errors

**Solution:**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Issue: Supabase connection error

**Check:**

1. `.env.local` file exists and has correct values
2. Supabase URL ends with `.supabase.co`
3. Anon key is the correct one (starts with `eyJ...`)
4. Database schema has been applied

**Test connection:**

```bash
# Add to a test file or run in Node
node -e "
const { createClient } = require('@supabase/supabase-js');
const url = 'your_url';
const key = 'your_key';
const supabase = createClient(url, key);
console.log('Supabase client created:', !!supabase);
"
```

### Issue: Images not loading

**Possible causes:**

1. Terraria Wiki is down (rare)
2. Item name has special characters
3. Network/firewall blocking image CDN

**Solution:**

-   Images are loaded from `https://terraria.wiki.gg/images/`
-   Fallback to SVG placeholders if loading fails
-   Check browser console for 404 errors

### Issue: Tests failing

**Solution:**

```bash
# Make sure Jest dependencies are installed
pnpm install --dev

# Clear Jest cache
pnpm jest --clearCache

# Run tests with verbose output
pnpm test --verbose
```

### Issue: Port 3000 already in use

**Solution:**

```bash
# Use a different port
pnpm dev --port 3001

# Or kill the process using port 3000 (Unix/Mac)
lsof -ti:3000 | xargs kill -9

# Or kill the process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🎯 Next Steps

After successful setup:

1. **Read the documentation**

    - [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Comprehensive development guide
    - [DATA_STRUCTURE.md](DATA_STRUCTURE.md) - Data file specifications
    - [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick command reference

2. **Explore the codebase**

    - Start with `app/page.tsx` (homepage)
    - Check `lib/terraria/types.ts` for data structures
    - Review `components/terraria/` for UI components

3. **Try creating a loadout**

    - Register an account at `/auth/sign-up`
    - Go to **My Loadouts** → **Create New**
    - Add armor, weapons, accessories
    - Save and share!

4. **Run tests**

    ```bash
    pnpm test
    ```

5. **Make your first change**
    - Edit a component
    - Save and see hot reload in action
    - Run tests to verify nothing broke

---

## 📦 Package Manager Notes

### Why pnpm?

This project uses **pnpm** exclusively:

✅ **Faster** - Hard links packages instead of copying  
✅ **Efficient** - Saves disk space (single package store)  
✅ **Strict** - Prevents phantom dependencies  
✅ **Compatible** - Works with all npm packages

### Migration from npm/yarn

If you're coming from npm or yarn:

```bash
# Remove old lock files
rm package-lock.json yarn.lock

# Remove node_modules
rm -rf node_modules

# Install with pnpm
pnpm install
```

### pnpm Commands (Quick Reference)

| npm/yarn             | pnpm              | Description                   |
| -------------------- | ----------------- | ----------------------------- |
| `npm install`        | `pnpm install`    | Install dependencies          |
| `npm install pkg`    | `pnpm add pkg`    | Add dependency                |
| `npm install -D pkg` | `pnpm add -D pkg` | Add dev dependency            |
| `npm uninstall pkg`  | `pnpm remove pkg` | Remove dependency             |
| `npm run script`     | `pnpm script`     | Run script (no `run` needed!) |
| `npm update`         | `pnpm update`     | Update dependencies           |

---

## ✅ Verification Checklist

Before starting development, verify:

-   [ ] Node.js 18+ installed (`node --version`)
-   [ ] pnpm installed (`pnpm --version`)
-   [ ] Dependencies installed (`pnpm install` succeeded)
-   [ ] `.env.local` file created with Supabase credentials
-   [ ] Database schema applied (tables created in Supabase)
-   [ ] Dev server starts (`pnpm dev` works)
-   [ ] Can access http://localhost:3000
-   [ ] Unit tests pass (`pnpm test` shows 37/37 passing)
-   [ ] E2E tests pass (`pnpm test:e2e` shows 30/30 passing)
-   [ ] Build succeeds (`pnpm build` completes without errors)

---

## 🆘 Getting Help

**Documentation:**

-   [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Detailed development info
-   [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet
-   [DATA_STRUCTURE.md](DATA_STRUCTURE.md) - Data format specs

**Common Issues:**

-   Check the Troubleshooting section above
-   Review error messages in terminal
-   Check browser console for frontend errors
-   Verify `.env.local` configuration

**Community:**

-   Open an issue on GitHub
-   Check existing issues for solutions
-   Join the Terraria community Discord

---

## 🎓 Learning Resources

**Next.js:**

-   https://nextjs.org/docs
-   https://nextjs.org/learn

**React:**

-   https://react.dev/learn

**TypeScript:**

-   https://www.typescriptlang.org/docs/

**Supabase:**

-   https://supabase.com/docs
-   https://supabase.com/docs/guides/auth

**Tailwind CSS:**

-   https://tailwindcss.com/docs

**pnpm:**

-   https://pnpm.io/motivation
-   https://pnpm.io/cli/add

---

**Ready to build? Run `pnpm dev` and start coding!** 🚀
