-- Users profile table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  spiritual_preference TEXT,
  learning_areas TEXT[],
  knowledge_level TEXT,
  biggest_challenge TEXT,
  thirty_day_goal TEXT,
  growth_meaning TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_interview_date TIMESTAMP WITH TIME ZONE
);

-- Daily sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_id UUID REFERENCES profiles(id),
  category TEXT NOT NULL,
  source_title TEXT,
  reading_content TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  session_date DATE DEFAULT CURRENT_DATE
);

-- AI chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID REFERENCES sessions(id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL
);

-- Streaks table
CREATE TABLE streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  total_sessions INTEGER DEFAULT 0,
  total_reading_minutes INTEGER DEFAULT 0
);
