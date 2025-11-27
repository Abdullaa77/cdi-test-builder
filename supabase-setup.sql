-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  project_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- USER BRANDING TABLE (for CDI Test Builder)
-- =============================================

-- Create user_branding table
CREATE TABLE IF NOT EXISTS user_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  accent_color TEXT DEFAULT '#F59E0B',
  logo_base64 TEXT DEFAULT NULL,
  logo_filename TEXT DEFAULT NULL,
  telegram_username TEXT DEFAULT '',
  academy_name TEXT DEFAULT 'Your Academy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_branding_user_id_idx ON user_branding(user_id);

-- Enable Row Level Security
ALTER TABLE user_branding ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own branding
CREATE POLICY "Users can view own branding"
  ON user_branding FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own branding
CREATE POLICY "Users can insert own branding"
  ON user_branding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own branding
CREATE POLICY "Users can update own branding"
  ON user_branding FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own branding
CREATE POLICY "Users can delete own branding"
  ON user_branding FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_branding_updated_at
  BEFORE UPDATE ON user_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
