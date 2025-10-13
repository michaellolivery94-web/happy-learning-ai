-- Add personality preference to profiles table
ALTER TABLE public.profiles
ADD COLUMN ai_personality text DEFAULT 'encouraging' CHECK (ai_personality IN ('encouraging', 'formal', 'playful'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.ai_personality IS 'AI tutor personality preference: encouraging (0.7 temp), formal (0.3 temp), or playful (0.9 temp)';