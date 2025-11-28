# Database Setup Guide

Complete guide for setting up the Supabase database from scratch for Terraria Loadout Maker.

## Prerequisites

-   Supabase account (https://supabase.com)
-   New Supabase project created

## Step 1: Get Your Environment Variables

After creating a Supabase project, get these values from Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

Add these to your `.env.local` file in the project root.

## Step 2: Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. Optional: Enable other providers (Google, GitHub, etc.)

## Step 3: Create Database Tables

Run the following SQL in the **SQL Editor** (Dashboard → SQL Editor → New Query):

### Core Tables Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
-- No need to create manually, handled by Supabase Auth

-- Loadouts table
CREATE TABLE public.loadouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_boss TEXT,
    game_mode TEXT NOT NULL DEFAULT 'vanilla',

    -- Equipment slots (JSONB for flexible structure)
    helmet JSONB,
    chest JSONB,
    legs JSONB,
    accessories JSONB DEFAULT '[]'::jsonb,
    weapons JSONB DEFAULT '[]'::jsonb,
    buffs JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    is_public BOOLEAN DEFAULT true,
    video_link TEXT,
    version_tag TEXT,
    view_count INTEGER DEFAULT 0,
    creator_username TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    creator_username TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items (many-to-many relationship)
CREATE TABLE public.collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(collection_id, loadout_id)
);

-- Favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, loadout_id)
);

-- Votes table (upvote/downvote system)
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, loadout_id)
);

-- Comments table (optional for future use)
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Loadouts indexes
CREATE INDEX idx_loadouts_user_id ON public.loadouts(user_id);
CREATE INDEX idx_loadouts_created_at ON public.loadouts(created_at DESC);
CREATE INDEX idx_loadouts_is_public ON public.loadouts(is_public);
CREATE INDEX idx_loadouts_game_mode ON public.loadouts(game_mode);
CREATE INDEX idx_loadouts_view_count ON public.loadouts(view_count DESC);

-- Collections indexes
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_is_public ON public.collections(is_public);

-- Collection items indexes
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_loadout_id ON public.collection_items(loadout_id);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_loadout_id ON public.favorites(loadout_id);

-- Votes indexes
CREATE INDEX idx_votes_loadout_id ON public.votes(loadout_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

-- Comments indexes
CREATE INDEX idx_comments_loadout_id ON public.comments(loadout_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
```

## Step 4: Create Database Functions

### Function: Get User Statistics

```sql
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_loadouts BIGINT,
    total_views BIGINT,
    total_favorites BIGINT,
    total_vote_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT l.id) AS total_loadouts,
        COALESCE(SUM(l.view_count), 0) AS total_views,
        COUNT(DISTINCT f.id) AS total_favorites,
        COALESCE(SUM(CASE
            WHEN v.vote_type = 'upvote' THEN 1
            WHEN v.vote_type = 'downvote' THEN -1
            ELSE 0
        END), 0) AS total_vote_score
    FROM public.loadouts l
    LEFT JOIN public.favorites f ON l.id = f.loadout_id
    LEFT JOIN public.votes v ON l.id = v.loadout_id
    WHERE l.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function: Get Loadout Vote Score

```sql
CREATE OR REPLACE FUNCTION public.get_loadout_vote_score(loadout_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    vote_score INTEGER;
BEGIN
    SELECT COALESCE(SUM(CASE
        WHEN vote_type = 'upvote' THEN 1
        WHEN vote_type = 'downvote' THEN -1
        ELSE 0
    END), 0) INTO vote_score
    FROM public.votes
    WHERE loadout_id = loadout_uuid;

    RETURN vote_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 5: Set Up Row Level Security (RLS)

### Enable RLS on all tables

```sql
ALTER TABLE public.loadouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
```

### Loadouts Policies

```sql
-- Anyone can view public loadouts
CREATE POLICY "Public loadouts are viewable by everyone"
ON public.loadouts FOR SELECT
USING (is_public = true);

-- Users can view their own loadouts
CREATE POLICY "Users can view own loadouts"
ON public.loadouts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own loadouts
CREATE POLICY "Users can insert own loadouts"
ON public.loadouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own loadouts
CREATE POLICY "Users can update own loadouts"
ON public.loadouts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own loadouts
CREATE POLICY "Users can delete own loadouts"
ON public.loadouts FOR DELETE
USING (auth.uid() = user_id);
```

### Collections Policies

```sql
-- Anyone can view public collections
CREATE POLICY "Public collections are viewable by everyone"
ON public.collections FOR SELECT
USING (is_public = true);

-- Users can view their own collections
CREATE POLICY "Users can view own collections"
ON public.collections FOR SELECT
USING (auth.uid() = user_id);

-- Users can create collections
CREATE POLICY "Users can create collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
ON public.collections FOR DELETE
USING (auth.uid() = user_id);
```

### Collection Items Policies

```sql
-- Users can view collection items for public collections
CREATE POLICY "Users can view public collection items"
ON public.collection_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_items.collection_id
        AND (is_public = true OR user_id = auth.uid())
    )
);

-- Users can manage items in their own collections
CREATE POLICY "Users can manage own collection items"
ON public.collection_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_items.collection_id
        AND user_id = auth.uid()
    )
);
```

### Favorites Policies

```sql
-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);
```

### Votes Policies

```sql
-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
ON public.votes FOR SELECT
USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
ON public.votes FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
ON public.votes FOR DELETE
USING (auth.uid() = user_id);
```

### Comments Policies

```sql
-- Anyone can view comments on public loadouts
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.loadouts
        WHERE id = comments.loadout_id
        AND is_public = true
    )
);

-- Authenticated users can comment
CREATE POLICY "Authenticated users can comment"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);
```

## Step 6: Create Database Triggers

### Auto-update timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to loadouts
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.loadouts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Apply to collections
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Apply to comments
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

## Step 7: Test Your Setup

Run a test query in SQL Editor:

```sql
-- Test that tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Test RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Migration Script for Existing Data

If you have existing data with the old boss delimiter:

```sql
-- Fix boss names containing commas by updating delimiter
UPDATE public.loadouts
SET target_boss = REPLACE(target_boss, ', ', ' | ')
WHERE target_boss IS NOT NULL
  AND target_boss LIKE '%,%';
```

## Verification Checklist

-   [ ] Environment variables added to `.env.local`
-   [ ] All tables created successfully
-   [ ] Indexes created
-   [ ] Database functions created
-   [ ] RLS enabled on all tables
-   [ ] RLS policies created for all tables
-   [ ] Triggers created for auto-updating timestamps
-   [ ] Test query runs successfully
-   [ ] Application connects to database

## Troubleshooting

### Connection Issues

-   Verify environment variables are correct
-   Check Supabase project is not paused
-   Ensure API keys are for the correct project

### RLS Issues

-   Temporarily disable RLS to test: `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`
-   Check policies match your authentication setup
-   Verify user is authenticated when testing

### Performance Issues

-   Ensure indexes are created
-   Check query execution plans in SQL Editor
-   Consider adding composite indexes for common query patterns

## Next Steps

After database setup:

1. Test authentication flow
2. Create a test loadout
3. Verify public/private visibility
4. Test favorites and voting
5. Deploy to production with the same schema
