import { getSupabaseClient, getSupabaseConfig } from './supabaseClient';
import { 
  Profile, Hostel, Room, Allocation, Attendance, 
  Complaint, Visitor, Fee, MessMenu, MessFeedback, Notification, UserRole 
} from '../types';

export interface IDatabaseService {
  isSupabaseActive(): boolean;
  
  // Auth
  login(email: string, role: UserRole): Promise<{ success: boolean; user?: Profile; message?: string }>;
  register(email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female'): Promise<{ success: boolean; user?: Profile; message?: string }>;
  getCurrentUser(): Promise<Profile | null>;
  signOut(): Promise<void>;

  // Hostels & Rooms
  getHostels(): Promise<Hostel[]>;
  addHostel(name: string, location?: string, type?: 'boys' | 'girls'): Promise<Hostel>;
  getRooms(hostelId?: string): Promise<Room[]>;
  addRoom(hostelId: string, roomNumber: string, floor: number, capacity: number): Promise<Room>;
  updateRoom(roomId: string, updates: Partial<Room>): Promise<Room>;
  
  // Allocations
  getAllocations(): Promise<Allocation[]>;
  allocateRoom(studentId: string, roomId: string): Promise<Allocation>;
  vacateRoom(allocationId: string): Promise<boolean>;

  // Attendance
  recordAttendance(studentId: string, status: 'present' | 'absent' | 'late', checkIn?: string, checkOut?: string): Promise<Attendance>;
  getAttendance(studentId?: string, date?: string): Promise<Attendance[]>;

  // Complaints
  getComplaints(studentId?: string, assignedTo?: string): Promise<Complaint[]>;
  addComplaint(studentId: string, category: string, description: string): Promise<Complaint>;
  updateComplaintStatus(complaintId: string, status: Complaint['status'], assignedTo?: string, resolvedAt?: string): Promise<Complaint>;

  // Visitors
  getVisitors(studentId?: string): Promise<Visitor[]>;
  addVisitor(visitorName: string, phone: string, studentId: string, purpose?: string): Promise<Visitor>;
  updateVisitorStatus(visitorId: string, status: Visitor['status'], entryTime?: string, exitTime?: string): Promise<Visitor>;

  // Fees
  getFees(studentId?: string): Promise<Fee[]>;
  addFee(studentId: string, amount: number, dueDate: string): Promise<Fee>;
  payFee(feeId: string): Promise<Fee>;

  // Mess Menu & Feedback
  getMessMenu(): Promise<MessMenu[]>;
  updateMessMenu(dayOfWeek: string, breakfast: string, lunch: string, dinner: string): Promise<MessMenu>;
  getMessFeedback(mealType?: string, date?: string): Promise<MessFeedback[]>;
  addMessFeedback(studentId: string, mealType: 'breakfast' | 'lunch' | 'dinner', rating: number, comment?: string): Promise<MessFeedback>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  addNotification(userId: string, title: string, message: string, type: Notification['type']): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
}

// -------------------------------------------------------------
// LOCAL SEED DATA
// -------------------------------------------------------------
export const SEED_PROFILES: Profile[] = [
  { id: 'usr_student1', name: 'Rahul Sharma', email: 'student@hostel.com', role: 'student', gender: 'male', phone: '9876543210', created_at: new Date().toISOString() },
  { id: 'usr_student2', name: 'Sneha Reddy', email: 'student2@hostel.com', role: 'student', gender: 'female', phone: '9876543211', created_at: new Date().toISOString() },
  { id: 'usr_admin', name: 'Alok Gupta (Admin)', email: 'admin@hostel.com', role: 'admin', gender: 'male', phone: '9876543212', created_at: new Date().toISOString() },
  { id: 'usr_warden', name: 'Dr. K.P. Singh (Warden)', email: 'warden@hostel.com', role: 'warden', gender: 'male', phone: '9876543213', created_at: new Date().toISOString() },
  { id: 'usr_security', name: 'Guard Ram Prasad', email: 'security@hostel.com', role: 'security', gender: 'male', phone: '9876543214', created_at: new Date().toISOString() },
  { id: 'usr_mess', name: 'Chef Ramesh Chandra', email: 'mess@hostel.com', role: 'mess_manager', gender: 'male', phone: '9876543215', created_at: new Date().toISOString() },
];

export const SEED_HOSTELS: Hostel[] = [
  { id: 'hostel_boys_a', name: 'Boys Hostel - Block A', type: 'boys', location: 'North Campus', created_at: new Date().toISOString() },
  { id: 'hostel_girls_b', name: 'Girls Hostel - Block B', type: 'girls', location: 'South Campus', created_at: new Date().toISOString() },
];

export const SEED_ROOMS: Room[] = [
  { id: 'room_101', hostel_id: 'hostel_boys_a', room_number: '101', floor: 1, capacity: 3, occupied: 1, created_at: new Date().toISOString() },
  { id: 'room_102', hostel_id: 'hostel_boys_a', room_number: '102', floor: 1, capacity: 3, occupied: 0, created_at: new Date().toISOString() },
  { id: 'room_201', hostel_id: 'hostel_girls_b', room_number: '201', floor: 2, capacity: 2, occupied: 1, created_at: new Date().toISOString() },
];

export const SEED_ALLOCATIONS: Allocation[] = [
  { id: 'alloc_1', student_id: 'usr_student1', room_id: 'room_101', assigned_at: new Date().toISOString(), status: 'active' },
  { id: 'alloc_2', student_id: 'usr_student2', room_id: 'room_201', assigned_at: new Date().toISOString(), status: 'active' },
];

export const SEED_ATTENDANCE: Attendance[] = [
  { id: 'att_1', student_id: 'usr_student1', date: new Date().toISOString().split('T')[0], status: 'present', check_in: new Date().toISOString() },
  { id: 'att_2', student_id: 'usr_student2', date: new Date().toISOString().split('T')[0], status: 'late', check_in: new Date().toISOString() },
];

export const SEED_COMPLAINTS: Complaint[] = [
  { id: 'comp_1', student_id: 'usr_student1', category: 'Plumbing', description: 'Leaking tap in room bathroom.', status: 'pending', created_at: new Date().toISOString() },
  { id: 'comp_2', student_id: 'usr_student2', category: 'Electrical', description: 'Fan making loud noise and rotating slowly.', status: 'in_progress', assigned_to: 'usr_warden', created_at: new Date().toISOString() },
];

export const SEED_VISITORS: Visitor[] = [
  { id: 'vis_1', visitor_name: 'Suresh Sharma', phone: '9888888888', student_id: 'usr_student1', purpose: 'Father visiting', entry_time: new Date().toISOString(), status: 'approved', created_at: new Date().toISOString() },
];

export const SEED_FEES: Fee[] = [
  { id: 'fee_1', student_id: 'usr_student1', amount: 25000, due_date: '2026-06-30', payment_status: 'unpaid', created_at: new Date().toISOString() },
  { id: 'fee_2', student_id: 'usr_student2', amount: 25000, due_date: '2026-05-15', payment_status: 'paid', paid_at: new Date().toISOString(), receipt_url: '#', created_at: new Date().toISOString() },
];

export const SEED_MESS_MENU: MessMenu[] = [
  { id: 'menu_1', day_of_week: 'Monday', breakfast: 'Idli, Sambar, Tea', lunch: 'Rice, Dal, Veg Kadhai, Curd', dinner: 'Roti, Paneer Masala, Kheer', created_at: new Date().toISOString() },
  { id: 'menu_2', day_of_week: 'Tuesday', breakfast: 'Poha, Sprouts, Milk', lunch: 'Rice, Rajma, Aloo Gobhi, Salad', dinner: 'Roti, Mix Veg Sabzi, Custard', created_at: new Date().toISOString() },
  { id: 'menu_3', day_of_week: 'Wednesday', breakfast: 'Aloo Paratha, Curd', lunch: 'Jeera Rice, Chole, Raita', dinner: 'Veg Biryani, Salan, Ice Cream', created_at: new Date().toISOString() },
  { id: 'menu_4', day_of_week: 'Thursday', breakfast: 'Bread Toast, Omelette/Banana, Juice', lunch: 'Rice, Dal Fry, Bhindi Masala', dinner: 'Roti, Egg Curry/Paneer, Gulab Jamun', created_at: new Date().toISOString() },
  { id: 'menu_5', day_of_week: 'Friday', breakfast: 'Upma, Coconut Chutney, Tea', lunch: 'Rice, Sambhar, Ivy Gourd Fry, Curd', dinner: 'Roti, Dal Makhani, Fruit Salad', created_at: new Date().toISOString() },
  { id: 'menu_6', day_of_week: 'Saturday', breakfast: 'Puri, Aloo Dum, Tea', lunch: 'Khichdi, Papad, Pickle, Chokha', dinner: 'Roti, Methi Chaman, Sooji Halwa', created_at: new Date().toISOString() },
  { id: 'menu_7', day_of_week: 'Sunday', breakfast: 'Sandwich, Cornflakes, Coffee', lunch: 'Veg Pulav, Shahi Paneer, Raita', dinner: 'Butter Naan, Kadai Chicken/Veg, Sweet', created_at: new Date().toISOString() },
];

export const SEED_MESS_FEEDBACK: MessFeedback[] = [
  { id: 'fb_1', student_id: 'usr_student1', meal_type: 'breakfast', rating: 4, comment: 'Nice hot idlis!', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'fb_2', student_id: 'usr_student2', meal_type: 'lunch', rating: 3, comment: 'Rajma was a bit salty.', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'not_1', user_id: 'usr_student1', title: 'Visitor Arrived', message: 'Your father Suresh Sharma is at the main gate. Please approve entry.', type: 'visitor', is_read: false, created_at: new Date().toISOString() },
  { id: 'not_2', user_id: 'usr_student1', title: 'Fees Due', message: 'Hostel fee of Rs. 25000 is due by June 30.', type: 'fee', is_read: false, created_at: new Date().toISOString() },
  { id: 'not_3', user_id: 'usr_student2', title: 'Complaint Assigned', message: 'Warden has assigned electrical team to fix your room fan.', type: 'complaint', is_read: false, created_at: new Date().toISOString() },
];

function getHostelType(hostel: { type?: 'boys' | 'girls'; name: string }): 'boys' | 'girls' {
  return hostel.type || (hostel.name.toLowerCase().includes('girls') ? 'girls' : 'boys');
}

function healProfiles(profiles: Profile[]): { healed: Profile[]; updated: boolean } {
  let updated = false;
  const healed = profiles.map(p => {
    if (!p.gender) {
      if (p.id === 'usr_student2' || p.email.toLowerCase().includes('student2') || p.name.toLowerCase().includes('sneha')) {
        p.gender = 'female';
      } else {
        p.gender = 'male';
      }
      updated = true;
    }
    return p;
  });
  return { healed, updated };
}

// -------------------------------------------------------------
// LOCAL STORAGE ADAPTER
// -------------------------------------------------------------
class LocalStorageAdapter implements IDatabaseService {
  isSupabaseActive(): boolean {
    return false;
  }

  private getStored<T>(key: string, seed: T): T {
    if (typeof window === 'undefined') return seed;
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    const data = JSON.parse(val);
    if (key === 'shms_profiles') {
      const { healed, updated } = healProfiles(data as Profile[]);
      if (updated) {
        localStorage.setItem(key, JSON.stringify(healed));
      }
      return healed as unknown as T;
    }
    if (key === 'shms_hostels') {
      let updated = false;
      const healed = (data as Hostel[]).map(h => {
        if (!h.type) {
          h.type = h.name.toLowerCase().includes('girls') ? 'girls' : 'boys';
          updated = true;
        }
        return h;
      });
      if (updated) {
        localStorage.setItem(key, JSON.stringify(healed));
      }
      return healed as unknown as T;
    }
    return data;
  }

  private setStored<T>(key: string, data: T): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Auth Operations
  async login(email: string, role: UserRole): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.role === role);
    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shms_current_user_id', user.id);
      }
      return { success: true, user };
    }
    return { success: false, message: `Account with email ${email} and role ${role} not found. Try logging in with the predefined accounts.` };
  }

  async register(email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female'): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Email already registered.' };
    }
    const newUser: Profile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
      gender,
      phone,
      created_at: new Date().toISOString()
    };
    profiles.push(newUser);
    this.setStored('shms_profiles', profiles);
    
    // Automatically auto-allocate room if role is student for test user (matching gender and notifying warden)
    if (role === 'student' && gender) {
      const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
      const hostels = this.getStored<Hostel[]>('shms_hostels', SEED_HOSTELS);
      const freeRoom = rooms.find(r => {
        const hostel = hostels.find(h => h.id === r.hostel_id);
        const hostelType = hostel ? getHostelType(hostel) : 'boys';
        const matchesGender = gender === 'female' ? hostelType === 'girls' : hostelType === 'boys';
        return r.occupied < r.capacity && matchesGender;
      });

      if (freeRoom) {
        freeRoom.occupied += 1;
        this.setStored('shms_rooms', rooms);
        const allocations = this.getStored<Allocation[]>('shms_allocations', SEED_ALLOCATIONS);
        allocations.push({
          id: 'alloc_' + Math.random().toString(36).substring(2, 9),
          student_id: newUser.id,
          room_id: freeRoom.id,
          assigned_at: new Date().toISOString(),
          status: 'active'
        });
        this.setStored('shms_allocations', allocations);

        const matchingHostel = hostels.find(h => h.id === freeRoom.hostel_id);
        const wardens = profiles.filter(p => p.role === 'warden');
        for (const w of wardens) {
          await this.addNotification(
            w.id,
            'New Room Auto-Allocation',
            `Student ${name} (${gender}) has registered and was auto-allocated Room ${freeRoom.room_number} in ${matchingHostel?.name || 'Hostel Block'}.`,
            'announcement'
          );
        }
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('shms_current_user_id', newUser.id);
    }
    return { success: true, user: newUser };
  }

  async getCurrentUser(): Promise<Profile | null> {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem('shms_current_user_id');
    if (!userId) return null;
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    return profiles.find(p => p.id === userId) || null;
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shms_current_user_id');
    }
  }

  // Hostels & Rooms
  async getHostels(): Promise<Hostel[]> {
    return this.getStored<Hostel[]>('shms_hostels', SEED_HOSTELS);
  }

  async addHostel(name: string, location?: string, type?: 'boys' | 'girls'): Promise<Hostel> {
    const hostels = await this.getHostels();
    const newHostel: Hostel = {
      id: 'hostel_' + Math.random().toString(36).substring(2, 9),
      name,
      type: type || (name.toLowerCase().includes('girls') ? 'girls' : 'boys'),
      location,
      created_at: new Date().toISOString()
    };
    hostels.push(newHostel);
    this.setStored('shms_hostels', hostels);
    return newHostel;
  }

  async getRooms(hostelId?: string): Promise<Room[]> {
    let rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
    const hostels = await this.getHostels();
    
    // Add hostel name
    rooms = rooms.map(r => {
      const hostel = hostels.find(h => h.id === r.hostel_id);
      return { ...r, hostel_name: hostel ? hostel.name : 'Unknown Hostel' };
    });

    if (hostelId) {
      rooms = rooms.filter(r => r.hostel_id === hostelId);
    }
    return rooms;
  }

  async addRoom(hostelId: string, roomNumber: string, floor: number, capacity: number): Promise<Room> {
    const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
    const newRoom: Room = {
      id: 'room_' + Math.random().toString(36).substring(2, 9),
      hostel_id: hostelId,
      room_number: roomNumber,
      floor,
      capacity,
      occupied: 0,
      created_at: new Date().toISOString()
    };
    rooms.push(newRoom);
    this.setStored('shms_rooms', rooms);
    return newRoom;
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) throw new Error('Room not found');
    rooms[idx] = { ...rooms[idx], ...updates };
    this.setStored('shms_rooms', rooms);
    return rooms[idx];
  }

  // Allocations
  async getAllocations(): Promise<Allocation[]> {
    const allocations = this.getStored<Allocation[]>('shms_allocations', SEED_ALLOCATIONS);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const rooms = await this.getRooms();

    return allocations.map(a => {
      const student = profiles.find(p => p.id === a.student_id);
      const room = rooms.find(r => r.id === a.room_id);
      return {
        ...a,
        student: student ? { name: student.name, email: student.email, phone: student.phone } : undefined,
        room: room ? { room_number: room.room_number, floor: room.floor, hostel_name: room.hostel_name } : undefined
      };
    });
  }

  async allocateRoom(studentId: string, roomId: string): Promise<Allocation> {
    const allocations = this.getStored<Allocation[]>('shms_allocations', SEED_ALLOCATIONS);
    const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const hostels = this.getStored<Hostel[]>('shms_hostels', SEED_HOSTELS);
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    if (room.occupied >= room.capacity) throw new Error('Room is already fully occupied');

    const student = profiles.find(p => p.id === studentId);
    if (!student) throw new Error('Student profile not found');

    const hostel = hostels.find(h => h.id === room.hostel_id);
    if (!hostel) throw new Error('Hostel block not found');

    const hostelType = getHostelType(hostel);
    const studentGender = student.gender || 'male';
    if (studentGender === 'male' && hostelType !== 'boys') {
      throw new Error(`Cannot allocate Male student (${student.name}) to a Girls Hostel block (${hostel.name}).`);
    }
    if (studentGender === 'female' && hostelType !== 'girls') {
      throw new Error(`Cannot allocate Female student (${student.name}) to a Boys Hostel block (${hostel.name}).`);
    }

    // Vacate active allocations for this student first
    const activeIdx = allocations.findIndex(a => a.student_id === studentId && a.status === 'active');
    if (activeIdx !== -1) {
      const oldRoomId = allocations[activeIdx].room_id;
      allocations[activeIdx].status = 'vacated';
      // Decrement occupancy of old room
      const oldRoom = rooms.find(r => r.id === oldRoomId);
      if (oldRoom) {
        oldRoom.occupied = Math.max(0, oldRoom.occupied - 1);
      }
    }

    // Allocate new room
    room.occupied += 1;
    const newAlloc: Allocation = {
      id: 'alloc_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      room_id: roomId,
      assigned_at: new Date().toISOString(),
      status: 'active'
    };
    allocations.push(newAlloc);
    
    this.setStored('shms_rooms', rooms);
    this.setStored('shms_allocations', allocations);

    // Create a notification for the student
    await this.addNotification(
      studentId,
      'Room Allocated',
      `You have been allocated room ${room.room_number} (Floor ${room.floor})`,
      'announcement'
    );

    // Notify all wardens
    const wardens = profiles.filter(p => p.role === 'warden');
    for (const w of wardens) {
      await this.addNotification(
        w.id,
        'Resident Allocated',
        `Student ${student.name} (${studentGender}) has been allocated to Room ${room.room_number} in ${hostel.name}.`,
        'announcement'
      );
    }

    return newAlloc;
  }

  async vacateRoom(allocationId: string): Promise<boolean> {
    const allocations = this.getStored<Allocation[]>('shms_allocations', SEED_ALLOCATIONS);
    const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);
    
    const idx = allocations.findIndex(a => a.id === allocationId);
    if (idx === -1) return false;
    
    const alloc = allocations[idx];
    if (alloc.status === 'active') {
      alloc.status = 'vacated';
      const room = rooms.find(r => r.id === alloc.room_id);
      if (room) {
        room.occupied = Math.max(0, room.occupied - 1);
      }
      this.setStored('shms_rooms', rooms);
      this.setStored('shms_allocations', allocations);

      await this.addNotification(
        alloc.student_id,
        'Room Vacated',
        'Your room assignment has been vacated.',
        'announcement'
      );
    }
    return true;
  }

  // Attendance
  async recordAttendance(studentId: string, status: 'present' | 'absent' | 'late', checkIn?: string, checkOut?: string): Promise<Attendance> {
    const attendance = this.getStored<Attendance[]>('shms_attendance', SEED_ATTENDANCE);
    const date = new Date().toISOString().split('T')[0];

    const idx = attendance.findIndex(a => a.student_id === studentId && a.date === date);
    const newRecord: Attendance = {
      id: idx !== -1 ? attendance[idx].id : 'att_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      date,
      status,
      check_in: checkIn || (idx !== -1 ? attendance[idx].check_in : new Date().toISOString()),
      check_out: checkOut || (idx !== -1 ? attendance[idx].check_out : undefined)
    };

    if (idx !== -1) {
      attendance[idx] = newRecord;
    } else {
      attendance.push(newRecord);
    }
    
    this.setStored('shms_attendance', attendance);
    return newRecord;
  }

  async getAttendance(studentId?: string, date?: string): Promise<Attendance[]> {
    let list = this.getStored<Attendance[]>('shms_attendance', SEED_ATTENDANCE);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);

    list = list.map(a => {
      const student = profiles.find(p => p.id === a.student_id);
      return {
        ...a,
        student_name: student ? student.name : 'Unknown Student',
        student_roll: student ? student.email.split('@')[0].toUpperCase() : 'N/A'
      };
    });

    if (studentId) {
      list = list.filter(a => a.student_id === studentId);
    }
    if (date) {
      list = list.filter(a => a.date === date);
    }
    return list;
  }

  // Complaints
  async getComplaints(studentId?: string, assignedTo?: string): Promise<Complaint[]> {
    let list = this.getStored<Complaint[]>('shms_complaints', SEED_COMPLAINTS);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);

    list = list.map(c => {
      const student = profiles.find(p => p.id === c.student_id);
      const assigned = profiles.find(p => p.id === c.assigned_to);
      return {
        ...c,
        student_name: student ? student.name : 'Unknown Student',
        assigned_to_name: assigned ? assigned.name : undefined
      };
    });

    if (studentId) {
      list = list.filter(c => c.student_id === studentId);
    }
    if (assignedTo) {
      list = list.filter(c => c.assigned_to === assignedTo);
    }
    return list;
  }

  async addComplaint(studentId: string, category: string, description: string): Promise<Complaint> {
    const list = this.getStored<Complaint[]>('shms_complaints', SEED_COMPLAINTS);
    const newComp: Complaint = {
      id: 'comp_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      category,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.push(newComp);
    this.setStored('shms_complaints', list);

    // Notify wardens and admins
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const student = profiles.find(p => p.id === studentId);
    const staff = profiles.filter(p => p.role === 'warden' || p.role === 'admin');
    for (const member of staff) {
      await this.addNotification(
        member.id,
        'New Complaint raised',
        `Student ${student?.name || 'Unknown'} submitted a complaint under ${category}.`,
        'complaint'
      );
    }

    return newComp;
  }

  async updateComplaintStatus(complaintId: string, status: Complaint['status'], assignedTo?: string, resolvedAt?: string): Promise<Complaint> {
    const list = this.getStored<Complaint[]>('shms_complaints', SEED_COMPLAINTS);
    const idx = list.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');
    
    list[idx].status = status;
    if (assignedTo !== undefined) list[idx].assigned_to = assignedTo;
    if (resolvedAt !== undefined) list[idx].resolved_at = resolvedAt;
    
    this.setStored('shms_complaints', list);

    // Notify the student
    await this.addNotification(
      list[idx].student_id,
      'Complaint Status Updated',
      `Your complaint ticket is now [${status.toUpperCase().replace('_', ' ')}]`,
      'complaint'
    );

    return list[idx];
  }

  // Visitors
  async getVisitors(studentId?: string): Promise<Visitor[]> {
    let list = this.getStored<Visitor[]>('shms_visitors', SEED_VISITORS);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const allocations = this.getStored<Allocation[]>('shms_allocations', SEED_ALLOCATIONS);
    const rooms = this.getStored<Room[]>('shms_rooms', SEED_ROOMS);

    list = list.map(v => {
      const student = profiles.find(p => p.id === v.student_id);
      const alloc = allocations.find(a => a.student_id === v.student_id && a.status === 'active');
      const room = alloc ? rooms.find(r => r.id === alloc.room_id) : null;
      return {
        ...v,
        student_name: student ? student.name : 'Unknown Student',
        room_number: room ? room.room_number : 'N/A'
      };
    });

    if (studentId) {
      list = list.filter(v => v.student_id === studentId);
    }
    return list;
  }

  async addVisitor(visitorName: string, phone: string, studentId: string, purpose?: string): Promise<Visitor> {
    const list = this.getStored<Visitor[]>('shms_visitors', SEED_VISITORS);
    const newVis: Visitor = {
      id: 'vis_' + Math.random().toString(36).substring(2, 9),
      visitor_name: visitorName,
      phone,
      student_id: studentId,
      purpose,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.push(newVis);
    this.setStored('shms_visitors', list);

    // Notify the student for approval
    await this.addNotification(
      studentId,
      'Visitor Approval Required',
      `${visitorName} is requesting entry to visit you. Purpose: ${purpose || 'Not specified'}.`,
      'visitor'
    );

    return newVis;
  }

  async updateVisitorStatus(visitorId: string, status: Visitor['status'], entryTime?: string, exitTime?: string): Promise<Visitor> {
    const list = this.getStored<Visitor[]>('shms_visitors', SEED_VISITORS);
    const idx = list.findIndex(v => v.id === visitorId);
    if (idx === -1) throw new Error('Visitor log not found');
    
    list[idx].status = status;
    if (entryTime !== undefined) list[idx].entry_time = entryTime;
    if (exitTime !== undefined) list[idx].exit_time = exitTime;
    
    this.setStored('shms_visitors', list);

    // Send notifications to security and student
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const security = profiles.filter(p => p.role === 'security');
    
    for (const guard of security) {
      await this.addNotification(
        guard.id,
        'Visitor Status Updated',
        `Visitor ${list[idx].visitor_name} status updated to ${status}`,
        'visitor'
      );
    }

    if (status === 'approved') {
      await this.addNotification(
        list[idx].student_id,
        'Visitor Approved',
        `Visitor ${list[idx].visitor_name} has been approved. They may check-in now.`,
        'visitor'
      );
    }

    return list[idx];
  }

  // Fees
  async getFees(studentId?: string): Promise<Fee[]> {
    let list = this.getStored<Fee[]>('shms_fees', SEED_FEES);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);

    list = list.map(f => {
      const student = profiles.find(p => p.id === f.student_id);
      return {
        ...f,
        student_name: student ? student.name : 'Unknown Student'
      };
    });

    if (studentId) {
      list = list.filter(f => f.student_id === studentId);
    }
    return list;
  }

  async addFee(studentId: string, amount: number, dueDate: string): Promise<Fee> {
    const list = this.getStored<Fee[]>('shms_fees', SEED_FEES);
    const newFee: Fee = {
      id: 'fee_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      amount,
      due_date: dueDate,
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };
    list.push(newFee);
    this.setStored('shms_fees', list);

    await this.addNotification(
      studentId,
      'New Fee Generated',
      `A new hostel fee invoice of Rs. ${amount} has been raised. Due: ${dueDate}`,
      'fee'
    );

    return newFee;
  }

  async payFee(feeId: string): Promise<Fee> {
    const list = this.getStored<Fee[]>('shms_fees', SEED_FEES);
    const idx = list.findIndex(f => f.id === feeId);
    if (idx === -1) throw new Error('Fee record not found');
    
    list[idx].payment_status = 'paid';
    list[idx].paid_at = new Date().toISOString();
    list[idx].receipt_url = '#'; // Mock receipt path
    
    this.setStored('shms_fees', list);

    await this.addNotification(
      list[idx].student_id,
      'Fee Payment Successful',
      `Payment of Rs. ${list[idx].amount} received. Receipt is ready.`,
      'fee'
    );

    return list[idx];
  }

  // Mess Menu & Feedback
  async getMessMenu(): Promise<MessMenu[]> {
    return this.getStored<MessMenu[]>('shms_mess_menu', SEED_MESS_MENU);
  }

  async updateMessMenu(dayOfWeek: string, breakfast: string, lunch: string, dinner: string): Promise<MessMenu> {
    const list = this.getStored<MessMenu[]>('shms_mess_menu', SEED_MESS_MENU);
    const idx = list.findIndex(m => m.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
    
    const newMenu: MessMenu = {
      id: idx !== -1 ? list[idx].id : 'menu_' + Math.random().toString(36).substring(2, 9),
      day_of_week: dayOfWeek,
      breakfast,
      lunch,
      dinner,
      created_at: new Date().toISOString()
    };

    if (idx !== -1) {
      list[idx] = newMenu;
    } else {
      list.push(newMenu);
    }
    this.setStored('shms_mess_menu', list);
    return newMenu;
  }

  async getMessFeedback(mealType?: string, date?: string): Promise<MessFeedback[]> {
    let list = this.getStored<MessFeedback[]>('shms_mess_feedback', SEED_MESS_FEEDBACK);
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);

    list = list.map(f => {
      const student = profiles.find(p => p.id === f.student_id);
      return {
        ...f,
        student_name: student ? student.name : 'Unknown Student'
      };
    });

    if (mealType) {
      list = list.filter(f => f.meal_type === mealType);
    }
    if (date) {
      list = list.filter(f => f.date === date);
    }
    return list;
  }

  async addMessFeedback(studentId: string, mealType: 'breakfast' | 'lunch' | 'dinner', rating: number, comment?: string): Promise<MessFeedback> {
    const list = this.getStored<MessFeedback[]>('shms_mess_feedback', SEED_MESS_FEEDBACK);
    const newFeedback: MessFeedback = {
      id: 'fb_' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      meal_type: mealType,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    list.push(newFeedback);
    this.setStored('shms_mess_feedback', list);

    // Notify Mess Manager
    const profiles = this.getStored<Profile[]>('shms_profiles', SEED_PROFILES);
    const messManagers = profiles.filter(p => p.role === 'mess_manager');
    for (const mgr of messManagers) {
      await this.addNotification(
        mgr.id,
        'New Meal Feedback',
        `A student rated ${mealType} as ${rating} stars.`,
        'announcement'
      );
    }

    return newFeedback;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const list = this.getStored<Notification[]>('shms_notifications', SEED_NOTIFICATIONS);
    return list.filter(n => n.user_id === userId).sort((a,b) => b.created_at.localeCompare(a.created_at));
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type']): Promise<Notification> {
    const list = this.getStored<Notification[]>('shms_notifications', SEED_NOTIFICATIONS);
    const newNotif: Notification = {
      id: 'not_' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    list.unshift(newNotif);
    this.setStored('shms_notifications', list);
    return newNotif;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const list = this.getStored<Notification[]>('shms_notifications', SEED_NOTIFICATIONS);
    const idx = list.findIndex(n => n.id === notificationId);
    if (idx === -1) return false;
    list[idx].is_read = true;
    this.setStored('shms_notifications', list);
    return true;
  }
}

// -------------------------------------------------------------
// SUPABASE ADAPTER
// -------------------------------------------------------------
class SupabaseAdapter implements IDatabaseService {
  isSupabaseActive(): boolean {
    return true;
  }

  // Auth Operations
  async login(email: string, role: UserRole): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, message: 'Supabase client not initialized.' };

    try {
      // Direct profiles query to find account with exact email and role.
      // In production, we'd use Supabase auth, but query profiles here to check roles.
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: false, message: `No profile found with email: ${email} and role: ${role}` };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('shms_current_user_id', data.id);
      }
      return { success: true, user: data as Profile };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error querying database' };
    }
  }

  async register(email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female'): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, message: 'Supabase client not initialized.' };

    try {
      // Check if email already exists
      const { data: existing } = await client
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        return { success: false, message: 'Email already registered.' };
      }

      // Generate a mock auth uuid for simplicity since we bypass complete auth verification for local runs
      const id = 'usr_' + Math.random().toString(36).substring(2, 12);
      const newProfile = { id, name, email, role, phone, gender, created_at: new Date().toISOString() };

      const { data, error } = await client
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      if (typeof window !== 'undefined') {
        localStorage.setItem('shms_current_user_id', data.id);
      }
      return { success: true, user: data as Profile };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getCurrentUser(): Promise<Profile | null> {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem('shms_current_user_id');
    if (!userId) return null;

    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Profile;
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shms_current_user_id');
    }
  }

  // Hostels & Rooms
  async getHostels(): Promise<Hostel[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from('hostels').select('*').order('name');
    if (error) return [];
    return data || [];
  }

  async addHostel(name: string, location?: string, type?: 'boys' | 'girls'): Promise<Hostel> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('hostels').insert([{ 
      name, 
      location, 
      type: type || (name.toLowerCase().includes('girls') ? 'girls' : 'boys') 
    }]).select().single();
    if (error) throw error;
    return data;
  }

  async getRooms(hostelId?: string): Promise<Room[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('rooms').select('*, hostels(name)');
    if (hostelId) {
      query = query.eq('hostel_id', hostelId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(r => ({
      ...r,
      hostel_name: r.hostels ? r.hostels.name : 'Unknown'
    }));
  }

  async addRoom(hostelId: string, roomNumber: string, floor: number, capacity: number): Promise<Room> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('rooms').insert([{ hostel_id: hostelId, room_number: roomNumber, floor, capacity }]).select().single();
    if (error) throw error;
    return data;
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('rooms').update(updates).eq('id', roomId).select().single();
    if (error) throw error;
    return data;
  }

  // Allocations
  async getAllocations(): Promise<Allocation[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from('allocations').select('*, student:profiles(name, email, phone), room:rooms(*, hostels(name))');
    if (error) return [];
    return (data || []).map(a => ({
      ...a,
      student: a.student ? { name: a.student.name, email: a.student.email, phone: a.student.phone } : undefined,
      room: a.room ? { room_number: a.room.room_number, floor: a.room.floor, hostel_name: a.room.hostels?.name } : undefined
    }));
  }

  async allocateRoom(studentId: string, roomId: string): Promise<Allocation> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');

    // 1. Validate student and room details
    const { data: student, error: studentErr } = await client.from('profiles').select('name, gender').eq('id', studentId).single();
    if (studentErr || !student) throw new Error('Student profile not found');

    const { data: room, error: roomErr } = await client.from('rooms').select('capacity, occupied, room_number, floor, hostel_id').eq('id', roomId).single();
    if (roomErr || !room) throw new Error('Room not found');
    if (room.occupied >= room.capacity) throw new Error('Room is full');

    const { data: hostel, error: hostelErr } = await client.from('hostels').select('name, type').eq('id', room.hostel_id).single();
    if (hostelErr || !hostel) throw new Error('Hostel block not found');

    const studentGender = student.gender || 'male';
    const hostelType = hostel.type || (hostel.name.toLowerCase().includes('girls') ? 'girls' : 'boys');
    if (studentGender === 'male' && hostelType !== 'boys') {
      throw new Error(`Cannot allocate Male student (${student.name}) to a Girls Hostel block (${hostel.name}).`);
    }
    if (studentGender === 'female' && hostelType !== 'girls') {
      throw new Error(`Cannot allocate Female student (${student.name}) to a Boys Hostel block (${hostel.name}).`);
    }

    // 2. Clear old allocations
    const { data: oldAlloc } = await client.from('allocations').select('*').eq('student_id', studentId).eq('status', 'active').maybeSingle();
    if (oldAlloc) {
      await client.from('allocations').update({ status: 'vacated' }).eq('id', oldAlloc.id);
      const { data: oldRoom } = await client.from('rooms').select('occupied').eq('id', oldAlloc.room_id).single();
      if (oldRoom) {
        await client.from('rooms').update({ occupied: Math.max(0, oldRoom.occupied - 1) }).eq('id', oldAlloc.room_id);
      }
    }

    // 3. Insert new allocation
    const { data: newAlloc, error: allocErr } = await client.from('allocations').insert([{ student_id: studentId, room_id: roomId, status: 'active' }]).select().single();
    if (allocErr) throw allocErr;

    // 4. Update new room occupancy
    await client.from('rooms').update({ occupied: room.occupied + 1 }).eq('id', roomId);

    // 5. Create notification for the student
    await this.addNotification(studentId, 'Room Allocated', `You have been allocated room ${room.room_number} (Floor ${room.floor})`, 'announcement');

    // 6. Notify all wardens
    const { data: wardens } = await client.from('profiles').select('id').eq('role', 'warden');
    if (wardens) {
      for (const w of wardens) {
        await this.addNotification(
          w.id,
          'Resident Allocated',
          `Student ${student.name} (${studentGender}) has been allocated to Room ${room.room_number} in ${hostel.name}.`,
          'announcement'
        );
      }
    }

    return newAlloc;
  }

  async vacateRoom(allocationId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const { data: alloc, error: allocErr } = await client.from('allocations').select('*').eq('id', allocationId).single();
    if (allocErr || !alloc) return false;

    if (alloc.status === 'active') {
      await client.from('allocations').update({ status: 'vacated' }).eq('id', allocationId);
      const { data: room } = await client.from('rooms').select('occupied').eq('id', alloc.room_id).single();
      if (room) {
        await client.from('rooms').update({ occupied: Math.max(0, room.occupied - 1) }).eq('id', alloc.room_id);
      }
      await this.addNotification(alloc.student_id, 'Room Vacated', 'Your room allocation has been vacated.', 'announcement');
    }
    return true;
  }

  // Attendance
  async recordAttendance(studentId: string, status: 'present' | 'absent' | 'late', checkIn?: string, checkOut?: string): Promise<Attendance> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const date = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await client.from('attendance').select('id, check_in').eq('student_id', studentId).eq('date', date).maybeSingle();
    
    let res;
    if (existing) {
      res = await client.from('attendance').update({
        status,
        check_in: checkIn || existing.check_in,
        check_out: checkOut || undefined
      }).eq('id', existing.id).select().single();
    } else {
      res = await client.from('attendance').insert([{
        student_id: studentId,
        date,
        status,
        check_in: checkIn || new Date().toISOString(),
        check_out: checkOut || undefined
      }]).select().single();
    }
    if (res.error) throw res.error;
    return res.data;
  }

  async getAttendance(studentId?: string, date?: string): Promise<Attendance[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('attendance').select('*, student:profiles(name, email)');
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (date) {
      query = query.eq('date', date);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(a => ({
      ...a,
      student_name: a.student ? a.student.name : 'Unknown student',
      student_roll: a.student ? a.student.email.split('@')[0].toUpperCase() : 'N/A'
    }));
  }

  // Complaints
  async getComplaints(studentId?: string, assignedTo?: string): Promise<Complaint[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('complaints').select('*, student:profiles!complaints_student_id_fkey(name), assigned:profiles!complaints_assigned_to_fkey(name)');
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(c => ({
      ...c,
      student_name: c.student ? c.student.name : 'Unknown Student',
      assigned_to_name: c.assigned ? c.assigned.name : undefined
    }));
  }

  async addComplaint(studentId: string, category: string, description: string): Promise<Complaint> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('complaints').insert([{ student_id: studentId, category, description, status: 'pending' }]).select().single();
    if (error) throw error;

    // Send notifications to wardens/admins
    const { data: staff } = await client.from('profiles').select('id').in('role', ['warden', 'admin']);
    if (staff) {
      const { data: student } = await client.from('profiles').select('name').eq('id', studentId).single();
      for (const member of staff) {
        await this.addNotification(member.id, 'New Complaint Raised', `Student ${student?.name || 'Unknown'} raised complaint under ${category}`, 'complaint');
      }
    }
    return data;
  }

  async updateComplaintStatus(complaintId: string, status: Complaint['status'], assignedTo?: string, resolvedAt?: string): Promise<Complaint> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const updates: any = { status };
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    if (resolvedAt !== undefined) updates.resolved_at = resolvedAt;
    
    const { data, error } = await client.from('complaints').update(updates).eq('id', complaintId).select().single();
    if (error) throw error;

    await this.addNotification(data.student_id, 'Complaint Status Updated', `Your complaint ticket status is now ${status.toUpperCase()}`, 'complaint');
    return data;
  }

  // Visitors
  async getVisitors(studentId?: string): Promise<Visitor[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('visitors').select('*, student:profiles(name)');
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(v => ({
      ...v,
      student_name: v.student ? v.student.name : 'Unknown Student'
    }));
  }

  async addVisitor(visitorName: string, phone: string, studentId: string, purpose?: string): Promise<Visitor> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('visitors').insert([{ visitor_name: visitorName, phone, student_id: studentId, purpose, status: 'pending' }]).select().single();
    if (error) throw error;

    await this.addNotification(studentId, 'Visitor Approval Required', `${visitorName} is requesting entry to see you.`, 'visitor');
    return data;
  }

  async updateVisitorStatus(visitorId: string, status: Visitor['status'], entryTime?: string, exitTime?: string): Promise<Visitor> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const updates: any = { status };
    if (entryTime !== undefined) updates.entry_time = entryTime;
    if (exitTime !== undefined) updates.exit_time = exitTime;

    const { data, error } = await client.from('visitors').update(updates).eq('id', visitorId).select().single();
    if (error) throw error;

    if (status === 'approved') {
      await this.addNotification(data.student_id, 'Visitor Approved', `Your visitor ${data.visitor_name} has been approved. Check-in registered.`, 'visitor');
    }
    return data;
  }

  // Fees
  async getFees(studentId?: string): Promise<Fee[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('fees').select('*, student:profiles(name)');
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(f => ({
      ...f,
      student_name: f.student ? f.student.name : 'Unknown Student'
    }));
  }

  async addFee(studentId: string, amount: number, dueDate: string): Promise<Fee> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('fees').insert([{ student_id: studentId, amount, due_date: dueDate, payment_status: 'unpaid' }]).select().single();
    if (error) throw error;

    await this.addNotification(studentId, 'Fees Invoiced', `New hostel fee of Rs. ${amount} generated. Due: ${dueDate}`, 'fee');
    return data;
  }

  async payFee(feeId: string): Promise<Fee> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('fees').update({ payment_status: 'paid', paid_at: new Date().toISOString(), receipt_url: '#' }).eq('id', feeId).select().single();
    if (error) throw error;

    await this.addNotification(data.student_id, 'Fee Paid', `Fee payment of Rs. ${data.amount} successfully processed.`, 'fee');
    return data;
  }

  // Mess Menu
  async getMessMenu(): Promise<MessMenu[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from('mess_menu').select('*').order('created_at');
    if (error) return [];
    return data || [];
  }

  async updateMessMenu(dayOfWeek: string, breakfast: string, lunch: string, dinner: string): Promise<MessMenu> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    
    // Check if entry exists
    const { data: existing } = await client.from('mess_menu').select('id').eq('day_of_week', dayOfWeek).maybeSingle();
    let res;
    if (existing) {
      res = await client.from('mess_menu').update({ breakfast, lunch, dinner }).eq('id', existing.id).select().single();
    } else {
      res = await client.from('mess_menu').insert([{ day_of_week: dayOfWeek, breakfast, lunch, dinner }]).select().single();
    }
    if (res.error) throw res.error;
    return res.data;
  }

  async getMessFeedback(mealType?: string, date?: string): Promise<MessFeedback[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    let query = client.from('mess_feedback').select('*, student:profiles(name)');
    if (mealType) {
      query = query.eq('meal_type', mealType);
    }
    if (date) {
      query = query.eq('date', date);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(f => ({
      ...f,
      student_name: f.student ? f.student.name : 'Unknown Student'
    }));
  }

  async addMessFeedback(studentId: string, mealType: 'breakfast' | 'lunch' | 'dinner', rating: number, comment?: string): Promise<MessFeedback> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('mess_feedback').insert([{
      student_id: studentId,
      meal_type: mealType,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    }]).select().single();
    if (error) throw error;
    return data;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type']): Promise<Notification> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not connected');
    const { data, error } = await client.from('notifications').insert([{ user_id: userId, title, message, type, is_read: false }]).select().single();
    if (error) throw error;
    return data;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client.from('notifications').update({ is_read: true }).eq('id', notificationId);
    return !error;
  }
}

// -------------------------------------------------------------
// NEXT.JS API BACKEND ADAPTER
// -------------------------------------------------------------
export class ApiAdapter implements IDatabaseService {
  isSupabaseActive(): boolean {
    return true; // Routed through the API Server (which can connect to Supabase)
  }

  private async fetchApi<T>(path: string, options: { method?: string; body?: any; query?: { [key: string]: string | undefined } } = {}): Promise<T> {
    const config = getSupabaseConfig();
    const url = `/api/${path}`;
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (config) {
      headers['x-supabase-url'] = config.url;
      headers['x-supabase-anon-key'] = config.anonKey;
    }

    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('shms_current_user_id') || '';
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let targetUrl = url;
    if (options.query) {
      const qParams = new URLSearchParams();
      Object.keys(options.query).forEach(k => {
        const val = options.query![k];
        if (val !== undefined) {
          qParams.append(k, val);
        }
      });
      const qStr = qParams.toString();
      if (qStr) {
        targetUrl += '?' + qStr;
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
    if (!res.ok) {
      let errMsg = 'API Error';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch (err) {
        try {
          errMsg = await res.text() || errMsg;
        } catch (_) {}
      }
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  }

  // Auth Operations
  async login(email: string, role: UserRole): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const res = await this.fetchApi<{ success: boolean; user?: Profile; message?: string }>('auth/login', {
      method: 'POST',
      body: { email, role }
    });
    if (res.success && res.user && typeof window !== 'undefined') {
      localStorage.setItem('shms_current_user_id', res.user.id);
    }
    return res;
  }

  async register(email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female'): Promise<{ success: boolean; user?: Profile; message?: string }> {
    const res = await this.fetchApi<{ success: boolean; user?: Profile; message?: string }>('auth/register', {
      method: 'POST',
      body: { email, name, role, phone, gender }
    });
    if (res.success && res.user && typeof window !== 'undefined') {
      localStorage.setItem('shms_current_user_id', res.user.id);
    }
    return res;
  }

  async getCurrentUser(): Promise<Profile | null> {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem('shms_current_user_id');
    if (!userId) return null;
    return this.fetchApi<Profile | null>('auth/me', {
      method: 'GET'
    });
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shms_current_user_id');
    }
  }

  // Hostels & Rooms
  async getHostels(): Promise<Hostel[]> {
    return this.fetchApi<Hostel[]>('hostels');
  }

  async addHostel(name: string, location?: string, type?: 'boys' | 'girls'): Promise<Hostel> {
    return this.fetchApi<Hostel>('hostels', {
      method: 'POST',
      body: { name, location, type }
    });
  }

  async getRooms(hostelId?: string): Promise<Room[]> {
    return this.fetchApi<Room[]>('rooms', {
      query: { hostelId }
    });
  }

  async addRoom(hostelId: string, roomNumber: string, floor: number, capacity: number): Promise<Room> {
    return this.fetchApi<Room>('rooms', {
      method: 'POST',
      body: { hostelId, roomNumber, floor, capacity }
    });
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    return this.fetchApi<Room>('rooms', {
      method: 'PATCH',
      body: { roomId, updates }
    });
  }

  // Allocations
  async getAllocations(): Promise<Allocation[]> {
    return this.fetchApi<Allocation[]>('allocations');
  }

  async allocateRoom(studentId: string, roomId: string): Promise<Allocation> {
    return this.fetchApi<Allocation>('allocations', {
      method: 'POST',
      body: { studentId, roomId }
    });
  }

  async vacateRoom(allocationId: string): Promise<boolean> {
    const res = await this.fetchApi<{ success: boolean }>('allocations', {
      method: 'DELETE',
      query: { allocationId }
    });
    return res.success;
  }

  // Attendance
  async recordAttendance(studentId: string, status: 'present' | 'absent' | 'late', checkIn?: string, checkOut?: string): Promise<Attendance> {
    return this.fetchApi<Attendance>('attendance', {
      method: 'POST',
      body: { studentId, status, checkIn, checkOut }
    });
  }

  async getAttendance(studentId?: string, date?: string): Promise<Attendance[]> {
    return this.fetchApi<Attendance[]>('attendance', {
      query: { studentId, date }
    });
  }

  // Complaints
  async getComplaints(studentId?: string, assignedTo?: string): Promise<Complaint[]> {
    return this.fetchApi<Complaint[]>('complaints', {
      query: { studentId, assignedTo }
    });
  }

  async addComplaint(studentId: string, category: string, description: string): Promise<Complaint> {
    return this.fetchApi<Complaint>('complaints', {
      method: 'POST',
      body: { studentId, category, description }
    });
  }

  async updateComplaintStatus(complaintId: string, status: Complaint['status'], assignedTo?: string, resolvedAt?: string): Promise<Complaint> {
    return this.fetchApi<Complaint>('complaints', {
      method: 'PATCH',
      body: { complaintId, status, assignedTo, resolvedAt }
    });
  }

  // Visitors
  async getVisitors(studentId?: string): Promise<Visitor[]> {
    return this.fetchApi<Visitor[]>('visitors', {
      query: { studentId }
    });
  }

  async addVisitor(visitorName: string, phone: string, studentId: string, purpose?: string): Promise<Visitor> {
    return this.fetchApi<Visitor>('visitors', {
      method: 'POST',
      body: { visitorName, phone, studentId, purpose }
    });
  }

  async updateVisitorStatus(visitorId: string, status: Visitor['status'], entryTime?: string, exitTime?: string): Promise<Visitor> {
    return this.fetchApi<Visitor>('visitors', {
      method: 'PATCH',
      body: { visitorId, status, entryTime, exitTime }
    });
  }

  // Fees
  async getFees(studentId?: string): Promise<Fee[]> {
    return this.fetchApi<Fee[]>('fees', {
      query: { studentId }
    });
  }

  async addFee(studentId: string, amount: number, dueDate: string): Promise<Fee> {
    return this.fetchApi<Fee>('fees', {
      method: 'POST',
      body: { studentId, amount, dueDate }
    });
  }

  async payFee(feeId: string): Promise<Fee> {
    return this.fetchApi<Fee>('fees', {
      method: 'PATCH',
      body: { feeId }
    });
  }

  // Mess Menu & Feedback
  async getMessMenu(): Promise<MessMenu[]> {
    return this.fetchApi<MessMenu[]>('mess/menu');
  }

  async updateMessMenu(dayOfWeek: string, breakfast: string, lunch: string, dinner: string): Promise<MessMenu> {
    return this.fetchApi<MessMenu>('mess/menu', {
      method: 'POST',
      body: { dayOfWeek, breakfast, lunch, dinner }
    });
  }

  async getMessFeedback(mealType?: string, date?: string): Promise<MessFeedback[]> {
    return this.fetchApi<MessFeedback[]>('mess/feedback', {
      query: { mealType, date }
    });
  }

  async addMessFeedback(studentId: string, mealType: 'breakfast' | 'lunch' | 'dinner', rating: number, comment?: string): Promise<MessFeedback> {
    return this.fetchApi<MessFeedback>('mess/feedback', {
      method: 'POST',
      body: { studentId, mealType, rating, comment }
    });
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return this.fetchApi<Notification[]>('notifications', {
      query: { userId }
    });
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type']): Promise<Notification> {
    return this.fetchApi<Notification>('notifications', {
      method: 'POST',
      body: { userId, title, message, type }
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const res = await this.fetchApi<{ success: boolean }>('notifications', {
      method: 'PATCH',
      body: { notificationId }
    });
    return res.success;
  }

  getSupabaseClient() {
    return getSupabaseClient();
  }
}

// Resolver singleton
let activeDbService: IDatabaseService | null = null;

export function getDbService(): IDatabaseService {
  if (activeDbService) return activeDbService;

  const config = getSupabaseConfig();
  if (config) {
    console.log('SHMS database: Connected to API Backend (Supabase Mode)');
    activeDbService = new ApiAdapter();
  } else {
    console.log('SHMS database: Running in LocalStorage fallback mode');
    activeDbService = new LocalStorageAdapter();
  }

  return activeDbService;
}

export function forceReloadDbService(): void {
  activeDbService = null;
}
