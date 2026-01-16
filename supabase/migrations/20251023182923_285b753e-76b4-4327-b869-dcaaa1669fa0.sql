-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  total_data_used DECIMAL(10, 2) DEFAULT 0,
  co2_emitted DECIMAL(10, 3) DEFAULT 0,
  green_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('photo', 'message', 'video')),
  size_mb DECIMAL(10, 2) NOT NULL,
  co2_grams DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- Create weekly_history table
CREATE TABLE public.weekly_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  data_used_mb DECIMAL(10, 2) DEFAULT 0,
  co2_emitted_grams DECIMAL(10, 3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_history
CREATE POLICY "Users can view own history" ON public.weekly_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.weekly_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON public.weekly_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges
CREATE POLICY "Users can view all badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own badges" ON public.badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_data_used = total_data_used + NEW.size_mb,
    co2_emitted = co2_emitted + NEW.co2_grams,
    green_points = green_points + CASE 
      WHEN NEW.size_mb < 1 THEN 10
      WHEN NEW.size_mb < 5 THEN 5
      ELSE 2
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_activity_created
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Function to update weekly history
CREATE OR REPLACE FUNCTION public.update_weekly_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start_date DATE;
BEGIN
  week_start_date := date_trunc('week', NEW.created_at)::DATE;
  
  INSERT INTO public.weekly_history (user_id, week_start, data_used_mb, co2_emitted_grams)
  VALUES (NEW.user_id, week_start_date, NEW.size_mb, NEW.co2_grams)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    data_used_mb = public.weekly_history.data_used_mb + EXCLUDED.data_used_mb,
    co2_emitted_grams = public.weekly_history.co2_emitted_grams + EXCLUDED.co2_emitted_grams;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_activity_for_weekly_history
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_weekly_history();