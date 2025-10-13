-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  category text NOT NULL,
  duration_minutes integer DEFAULT 15,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Lessons policies (everyone can read)
CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  USING (true);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false,
  score integer CHECK (score >= 0 AND score <= 100),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- User progress policies
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('user', 'assistant')) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample lessons
INSERT INTO public.lessons (title, description, content, difficulty, category, duration_minutes) VALUES
('Introduction to Mathematics', 'Learn the basics of mathematics including numbers, operations, and problem-solving', 'Welcome to mathematics! In this lesson, we''ll explore fundamental concepts that form the foundation of all mathematical thinking. You''ll learn about numbers, basic operations, and how to approach mathematical problems.', 'beginner', 'Mathematics', 20),
('Basic Grammar Rules', 'Master the fundamentals of English grammar for better communication', 'Grammar is the backbone of clear communication. This lesson covers essential grammar rules including parts of speech, sentence structure, and common grammatical patterns.', 'beginner', 'English', 25),
('Introduction to Science', 'Explore the scientific method and basic scientific concepts', 'Science helps us understand the world around us. Learn about the scientific method, how to make observations, form hypotheses, and conduct experiments.', 'beginner', 'Science', 30),
('World History Overview', 'Journey through key events and periods in world history', 'Discover the major events, civilizations, and turning points that have shaped our world. From ancient civilizations to modern times.', 'intermediate', 'History', 35),
('Creative Writing Basics', 'Develop your creative writing skills and storytelling abilities', 'Unleash your creativity! Learn the fundamentals of creative writing, character development, plot structure, and descriptive techniques.', 'beginner', 'Language Arts', 25);