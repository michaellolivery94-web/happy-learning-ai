-- Add preferred_subject to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferred_subject text DEFAULT 'General Learning';

-- Add check constraint for valid subjects
ALTER TABLE public.profiles
ADD CONSTRAINT valid_subject CHECK (preferred_subject IN ('Math', 'Science', 'History', 'Language Arts', 'General Learning', 'Programming', 'Art', 'Music'));