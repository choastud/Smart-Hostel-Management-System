-- AuraHost - Supabase Database Schema
-- Execute this script in the SQL Editor of your Supabase Project dashboard.

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS mess_feedback CASCADE;
DROP TABLE IF EXISTS mess_menu CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hostels CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'warden', 'security', 'mess_manager')),
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HOSTELS TABLE
CREATE TABLE hostels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  type TEXT CHECK (type IN ('boys', 'girls')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROOMS TABLE
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  hostel_id TEXT REFERENCES hostels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 3,
  occupied INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALLOCATIONS TABLE
CREATE TABLE allocations (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'vacated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE TABLE
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLAINTS TABLE
CREATE TABLE complaints (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE CONSTRAINT complaints_student_id_fkey,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  assigned_to TEXT REFERENCES profiles(id) ON DELETE SET NULL CONSTRAINT complaints_assigned_to_fkey,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VISITORS TABLE
CREATE TABLE visitors (
  id TEXT PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEES TABLE
CREATE TABLE fees (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESS MENU TABLE
CREATE TABLE mess_menu (
  id TEXT PRIMARY KEY,
  day_of_week TEXT UNIQUE NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MESS FEEDBACK TABLE
CREATE TABLE mess_feedback (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('visitor', 'fee', 'complaint', 'announcement')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) on all tables for sandbox testing simplicity
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE hostels DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE mess_menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE mess_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
