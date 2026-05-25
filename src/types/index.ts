export type UserRole = 'student' | 'admin' | 'warden' | 'security' | 'mess_manager';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: 'male' | 'female';
  phone?: string;
  created_at: string;
}

export interface Hostel {
  id: string;
  name: string;
  type: 'boys' | 'girls';
  location?: string;
  created_at: string;
}

export interface Room {
  id: string;
  hostel_id: string;
  room_number: string;
  floor: number;
  capacity: number;
  occupied: number;
  created_at: string;
  hostel_name?: string; // joined field
}

export interface Allocation {
  id: string;
  student_id: string;
  room_id: string;
  assigned_at: string;
  status: 'active' | 'vacated';
  student?: { name: string; email: string; phone?: string }; // joined field
  room?: { room_number: string; floor: number; hostel_name?: string }; // joined field
}

export interface Attendance {
  id: string;
  student_id: string;
  check_in?: string;
  check_out?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  student_name?: string; // joined field
  student_roll?: string; // joined field (email prefix or roll)
}

export interface Complaint {
  id: string;
  student_id: string;
  category: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  resolved_at?: string;
  student_name?: string; // joined field
  assigned_to_name?: string; // joined field
}

export interface Visitor {
  id: string;
  visitor_name: string;
  phone: string;
  student_id: string;
  entry_time?: string;
  exit_time?: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked_out';
  purpose?: string;
  created_at: string;
  student_name?: string; // joined field
  room_number?: string; // joined field
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  payment_status: 'paid' | 'unpaid' | 'overdue';
  paid_at?: string;
  receipt_url?: string;
  created_at: string;
  student_name?: string; // joined field
}

export interface MessMenu {
  id: string;
  day_of_week: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  created_at: string;
}

export interface MessFeedback {
  id: string;
  student_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  rating: number;
  comment?: string;
  date: string;
  created_at: string;
  student_name?: string; // joined field
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'complaint' | 'fee' | 'visitor' | 'announcement';
  is_read: boolean;
  created_at: string;
}
