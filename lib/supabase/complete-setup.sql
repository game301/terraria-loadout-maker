-- ============================================================================
-- TERRARIA LOADOUT MAKER - COMPLETE DATABASE SETUP
-- ============================================================================
-- Run this entire script in Supabase SQL Editor to set up everything
-- This creates: tables, indexes, functions, RLS policies, and triggers
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Loadouts table
CREATE TABLE IF NOT EXISTS public.loadouts (
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
    ammo JSONB DEFAULT '[]'::jsonb,
    
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
CREATE TABLE IF NOT EXISTS public.collections (
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
CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, loadout_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, loadout_id)
);

-- Votes table (upvote/downvote system)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, loadout_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loadout_id UUID NOT NULL REFERENCES public.loadouts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Loadouts indexes
CREATE INDEX IF NOT EXISTS idx_loadouts_user_id ON public.loadouts(user_id);
CREATE INDEX IF NOT EXISTS idx_loadouts_created_at ON public.loadouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loadouts_is_public ON public.loadouts(is_public);
CREATE INDEX IF NOT EXISTS idx_loadouts_game_mode ON public.loadouts(game_mode);
CREATE INDEX IF NOT EXISTS idx_loadouts_view_count ON public.loadouts(view_count DESC);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON public.collections(is_public);

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_loadout_id ON public.collection_items(loadout_id);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_loadout_id ON public.favorites(loadout_id);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_loadout_id ON public.votes(loadout_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_loadout_id ON public.comments(loadout_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get User Statistics
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

-- Function: Get Loadout Vote Score
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

-- Function: Auto-update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_updated_at ON public.loadouts;
DROP TRIGGER IF EXISTS set_updated_at ON public.collections;
DROP TRIGGER IF EXISTS set_updated_at ON public.comments;

-- Create triggers
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.loadouts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.loadouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public loadouts are viewable by everyone" ON public.loadouts;
DROP POLICY IF EXISTS "Users can view own loadouts" ON public.loadouts;
DROP POLICY IF EXISTS "Users can insert own loadouts" ON public.loadouts;
DROP POLICY IF EXISTS "Users can update own loadouts" ON public.loadouts;
DROP POLICY IF EXISTS "Users can delete own loadouts" ON public.loadouts;

DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Users can view own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;

DROP POLICY IF EXISTS "Users can view public collection items" ON public.collection_items;
DROP POLICY IF EXISTS "Users can manage own collection items" ON public.collection_items;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;

DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Loadouts Policies
CREATE POLICY "Public loadouts are viewable by everyone"
ON public.loadouts FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view own loadouts"
ON public.loadouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loadouts"
ON public.loadouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loadouts"
ON public.loadouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loadouts"
ON public.loadouts FOR DELETE
USING (auth.uid() = user_id);

-- Collections Policies
CREATE POLICY "Public collections are viewable by everyone"
ON public.collections FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view own collections"
ON public.collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
ON public.collections FOR DELETE
USING (auth.uid() = user_id);

-- Collection Items Policies
CREATE POLICY "Users can view public collection items"
ON public.collection_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_items.collection_id
        AND (is_public = true OR user_id = auth.uid())
    )
);

CREATE POLICY "Users can manage own collection items"
ON public.collection_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_items.collection_id
        AND user_id = auth.uid()
    )
);

-- Favorites Policies
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Anyone can view votes"
ON public.votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
ON public.votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
ON public.votes FOR DELETE
USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.loadouts
        WHERE id = comments.loadout_id
        AND is_public = true
    )
);

CREATE POLICY "Authenticated users can comment"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- MIGRATION (Optional - Run if you have existing data with old delimiter)
-- ============================================================================

-- Fix boss names containing commas by updating delimiter
-- UPDATE public.loadouts
-- SET target_boss = REPLACE(target_boss, ', ', ' | ')
-- WHERE target_boss IS NOT NULL
--   AND target_boss LIKE '%,%';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Your database is now ready for the Terraria Loadout Maker!
-- 
-- Next steps:
-- 1. Add your Supabase URL and key to .env.local
-- 2. Test the connection by running the app
-- 3. Create a test loadout to verify everything works
-- ============================================================================
