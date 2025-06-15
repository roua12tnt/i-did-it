-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create dos table
CREATE TABLE public.dos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  do_id UUID REFERENCES public.dos(id) ON DELETE CASCADE NOT NULL,
  achieved_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, do_id, achieved_date)
);

-- Create message_sets table
CREATE TABLE public.message_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create praise_messages table
CREATE TABLE public.praise_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES public.message_sets(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default message set
INSERT INTO public.message_sets (name) VALUES ('デフォルト');

-- Insert initial praise messages (linked to default set)
INSERT INTO public.praise_messages (set_id, message) 
SELECT 
  (SELECT id FROM public.message_sets WHERE name = 'デフォルト'),
  unnest(ARRAY[
    'すごい！今日もやり遂げましたね！',
    '素晴らしい継続力です！',
    '毎日の積み重ねが大きな成果に繋がります！',
    '今日も一歩前進！あなたは素晴らしい！',
    '継続は力なり！その調子です！',
    '今日の達成、おめでとうございます！',
    'あなたの努力が実を結んでいます！',
    '毎日の小さな勝利が大きな変化を生みます！',
    '今日もお疲れ様でした！素晴らしい一日でした！',
    '継続している自分を誇らしく思ってください！'
  ]);

-- Add user message set preference to profiles
ALTER TABLE public.profiles ADD COLUMN selected_message_set_id UUID REFERENCES public.message_sets(id);

-- Set default message set for all users
UPDATE public.profiles SET selected_message_set_id = (SELECT id FROM public.message_sets WHERE name = 'デフォルト');

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Dos policies
CREATE POLICY "Users can view own dos" ON public.dos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dos" ON public.dos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dos" ON public.dos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dos" ON public.dos
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements" ON public.achievements
  FOR DELETE USING (auth.uid() = user_id);

-- Message sets policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view message sets" ON public.message_sets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Praise messages policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view praise messages" ON public.praise_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to limit dos to 3 per user
CREATE OR REPLACE FUNCTION check_dos_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.dos WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Users can only have up to 3 dos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_dos_per_user
  BEFORE INSERT ON public.dos
  FOR EACH ROW
  EXECUTE FUNCTION check_dos_limit();

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER dos_updated_at
  BEFORE UPDATE ON public.dos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER message_sets_updated_at
  BEFORE UPDATE ON public.message_sets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();