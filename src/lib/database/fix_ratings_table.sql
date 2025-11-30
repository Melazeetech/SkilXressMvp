-- Fix ratings table to require bookings for reviews
-- This ensures only users with completed bookings can leave reviews

-- 1. Ensure booking_id is NOT NULL (required)
-- First, set any null booking_ids to a valid booking or remove those rows
DELETE FROM public.ratings WHERE booking_id IS NULL;

-- Now make it required
ALTER TABLE public.ratings 
    ALTER COLUMN booking_id SET NOT NULL;

-- 2. Ensure there's a unique constraint to prevent duplicate reviews from same user
-- First drop if exists, then recreate
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ratings_client_provider_unique'
    ) THEN
        ALTER TABLE public.ratings DROP CONSTRAINT ratings_client_provider_unique;
    END IF;
END $$;

-- Add unique constraint to prevent duplicate reviews per booking
-- This allows users to review multiple times if they book multiple times
-- But prevents duplicate reviews for the same booking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ratings_booking_unique'
    ) THEN
        ALTER TABLE public.ratings
            ADD CONSTRAINT ratings_booking_unique 
            UNIQUE (booking_id);
    END IF;
END $$;

-- 3. Enable RLS if not already enabled
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 4. Update RLS policies
DROP POLICY IF EXISTS "Users can insert reviews" ON public.ratings;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.ratings;
DROP POLICY IF EXISTS "Users can insert their reviews" ON public.ratings;

-- Allow users to insert reviews only for their own completed bookings
CREATE POLICY "Users can insert their reviews"
    ON public.ratings
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id 
        AND EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_id 
            AND bookings.client_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

-- Allow anyone to view reviews
CREATE POLICY "Anyone can view reviews"
    ON public.ratings
    FOR SELECT
    USING (true);
