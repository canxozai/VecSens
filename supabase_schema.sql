-- ==============================================================================
-- 🚀 VECSENS ESPORTS CLOUD VAULT - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard > SQL Editor kısmına yapıştırıp "Run" butonuna basın.
-- Tamamen ücretsizdir ve tüm cihazlardan anında senkronize erişim sağlar.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.vecsens_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'crosshair',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. History Table (Aim & Hassasiyet Kayıtları)
CREATE TABLE IF NOT EXISTS public.vecsens_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  dpi NUMERIC NOT NULL,
  recommended_sens NUMERIC NOT NULL,
  edpi NUMERIC NOT NULL,
  cm360 NUMERIC NOT NULL,
  half_turn NUMERIC,
  profile_type TEXT,
  profiles JSONB,
  answers JSONB,
  note TEXT,
  mouse_model TEXT,
  grip_style TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aim Scores Table (Aim Testi Skorları)
CREATE TABLE IF NOT EXISTS public.vecsens_aim_scores (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  score NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  hits NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  mode TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Feedbacks Table
CREATE TABLE IF NOT EXISTS public.vecsens_feedback (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  rating NUMERIC NOT NULL,
  tried TEXT,
  likes JSONB,
  improve JSONB,
  text TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLİTİKALARI (Herkes Sadece Kendi Verisini Görür)
-- ==============================================================================
ALTER TABLE public.vecsens_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vecsens_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vecsens_aim_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vecsens_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.vecsens_profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.vecsens_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.vecsens_profiles;
CREATE POLICY "Users can insert their own profile" ON public.vecsens_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.vecsens_profiles;
CREATE POLICY "Users can update their own profile" ON public.vecsens_profiles FOR UPDATE USING (auth.uid() = id);

-- History Policies
DROP POLICY IF EXISTS "Users can view their own history" ON public.vecsens_history;
CREATE POLICY "Users can view their own history" ON public.vecsens_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own history" ON public.vecsens_history;
CREATE POLICY "Users can insert their own history" ON public.vecsens_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own history" ON public.vecsens_history;
CREATE POLICY "Users can delete their own history" ON public.vecsens_history FOR DELETE USING (auth.uid() = user_id);

-- Aim Scores Policies
DROP POLICY IF EXISTS "Users can view their own aim scores" ON public.vecsens_aim_scores;
CREATE POLICY "Users can view their own aim scores" ON public.vecsens_aim_scores FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own aim scores" ON public.vecsens_aim_scores;
CREATE POLICY "Users can insert their own aim scores" ON public.vecsens_aim_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback Policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.vecsens_feedback;
CREATE POLICY "Anyone can submit feedback" ON public.vecsens_feedback FOR INSERT WITH CHECK (true);
