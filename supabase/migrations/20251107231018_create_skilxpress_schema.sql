/*
  # SkilXpress Database Schemaa

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `user_type` (text) - 'client' or 'provider'
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `phone` (text, nullable)
      - `location` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `skill_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `icon` (text)
      - `created_at` (timestamptz)

    - `provider_skills`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references profiles)
      - `category_id` (uuid, references skill_categories)
      - `is_available` (boolean)
      - `created_at` (timestamptz)

    - `skill_videos`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references profiles)
      - `category_id` (uuid, references skill_categories)
      - `video_url` (text)
      - `thumbnail_url` (text, nullable)
      - `title` (text)
      - `description` (text, nullable)
      - `duration` (integer, seconds)
      - `likes_count` (integer)
      - `views_count` (integer)
      - `created_at` (timestamptz)

    - `video_likes`
      - `id` (uuid, primary key)
      - `video_id` (uuid, references skill_videos)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (video_id, user_id)

    - `bookings`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references profiles)
      - `provider_id` (uuid, references profiles)
      - `video_id` (uuid, references skill_videos, nullable)
      - `category_id` (uuid, references skill_categories)
      - `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
      - `preferred_date` (date)
      - `preferred_time` (text)
      - `location` (text)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `sender_id` (uuid, references profiles)
      - `message` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

    - `ratings`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `provider_id` (uuid, references profiles)
      - `client_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `review` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Providers can manage their videos and view bookings
    - Clients can create bookings and send messages
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client', 'provider')),
  avatar_url text,
  bio text,
  phone text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create skill_categories table
CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skill categories"
  ON skill_categories FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO skill_categories (name, icon) VALUES
  ('Barber', 'Scissors'),
  ('Plumber', 'Wrench'),
  ('Electrician', 'Zap'),
  ('Painter', 'Paintbrush'),
  ('Makeup Artist', 'Sparkles'),
  ('Carpenter', 'Hammer'),
  ('Cleaner', 'Sparkles'),
  ('Chef', 'ChefHat'),
  ('Photographer', 'Camera'),
  ('Mechanic', 'Settings')
ON CONFLICT (name) DO NOTHING;

-- Create provider_skills table
CREATE TABLE IF NOT EXISTS provider_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, category_id)
);

ALTER TABLE provider_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view provider skills"
  ON provider_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can manage own skills"
  ON provider_skills FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Create skill_videos table
CREATE TABLE IF NOT EXISTS skill_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  thumbnail_url text,
  title text NOT NULL,
  description text,
  duration integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view videos"
  ON skill_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can manage own videos"
  ON skill_videos FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Create video_likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES skill_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON video_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON video_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid REFERENCES skill_videos(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES skill_categories(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  location text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their bookings"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND (bookings.client_id = auth.uid() OR bookings.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages for their bookings"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND (bookings.client_id = auth.uid() OR bookings.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages they received"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND (bookings.client_id = auth.uid() OR bookings.provider_id = auth.uid())
      AND sender_id != auth.uid()
    )
  );

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can create ratings for their bookings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_skill_videos_provider ON skill_videos(provider_id);
CREATE INDEX IF NOT EXISTS idx_skill_videos_category ON skill_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_provider ON ratings(provider_id);

-- Create function to update likes_count
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE skill_videos
    SET likes_count = likes_count + 1
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE skill_videos
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_likes_count
AFTER INSERT OR DELETE ON video_likes
FOR EACH ROW
EXECUTE FUNCTION update_video_likes_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
