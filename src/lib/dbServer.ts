import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Profile, Hostel, Room, Allocation, Attendance, 
  Complaint, Visitor, Fee, MessMenu, MessFeedback, Notification, UserRole 
} from '../types';
import { 
  SEED_PROFILES, SEED_HOSTELS, SEED_ROOMS, SEED_ALLOCATIONS, 
  SEED_ATTENDANCE, SEED_COMPLAINTS, SEED_VISITORS, SEED_FEES, 
  SEED_MESS_MENU, SEED_MESS_FEEDBACK, SEED_NOTIFICATIONS 
} from '../services/db';

const DB_FILE = path.join(process.cwd(), 'src', 'services', 'local_db.json');

// Interface representing the structure of our JSON file database
interface LocalDbStructure {
  profiles: Profile[];
  hostels: Hostel[];
  rooms: Room[];
  allocations: Allocation[];
  attendance: Attendance[];
  complaints: Complaint[];
  visitors: Visitor[];
  fees: Fee[];
  mess_menu: MessMenu[];
  mess_feedback: MessFeedback[];
  notifications: Notification[];
}

// -------------------------------------------------------------
// FILE SYSTEM DB HELPERS
// -------------------------------------------------------------
function readLocalDb(): LocalDbStructure {
  if (!fs.existsSync(DB_FILE)) {
    const parentDir = path.dirname(DB_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const initialData: LocalDbStructure = {
      profiles: SEED_PROFILES,
      hostels: SEED_HOSTELS,
      rooms: SEED_ROOMS,
      allocations: SEED_ALLOCATIONS,
      attendance: SEED_ATTENDANCE,
      complaints: SEED_COMPLAINTS,
      visitors: SEED_VISITORS,
      fees: SEED_FEES,
      mess_menu: SEED_MESS_MENU,
      mess_feedback: SEED_MESS_FEEDBACK,
      notifications: SEED_NOTIFICATIONS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as LocalDbStructure;
    let updated = false;
    if (data.profiles) {
      data.profiles = data.profiles.map(p => {
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
    }
    if (data.hostels) {
      data.hostels = data.hostels.map(h => {
        if (!h.type) {
          h.type = h.name.toLowerCase().includes('girls') ? 'girls' : 'boys';
          updated = true;
        }
        return h;
      });
    }
    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
  } catch (error) {
    console.error('Error reading local server db file, resetting to seeds:', error);
    const initialData: LocalDbStructure = {
      profiles: SEED_PROFILES,
      hostels: SEED_HOSTELS,
      rooms: SEED_ROOMS,
      allocations: SEED_ALLOCATIONS,
      attendance: SEED_ATTENDANCE,
      complaints: SEED_COMPLAINTS,
      visitors: SEED_VISITORS,
      fees: SEED_FEES,
      mess_menu: SEED_MESS_MENU,
      mess_feedback: SEED_MESS_FEEDBACK,
      notifications: SEED_NOTIFICATIONS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function writeLocalDb(data: LocalDbStructure): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to write changes to specific collections in local file DB
function updateCollection<K extends keyof LocalDbStructure>(collectionKey: K, updateFn: (items: LocalDbStructure[K]) => void): void {
  const db = readLocalDb();
  updateFn(db[collectionKey]);
  writeLocalDb(db);
}

// -------------------------------------------------------------
// UNIFIED SERVER CONTROLLER
// -------------------------------------------------------------
export class DbServerInstance {
  private client: SupabaseClient | null = null;

  constructor(supabaseUrl?: string | null, supabaseKey?: string | null) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (url && key && url.startsWith('http')) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
      } catch (e) {
        console.error('Failed to create server-side Supabase client:', e);
        this.client = null;
      }
    }
  }

  isSupabase(): boolean {
    return this.client !== null;
  }

  // -------------------------------------------------------------
  // AUTHENTICATION & PROFILES
  // -------------------------------------------------------------
  async login(email: string, role: UserRole): Promise<{ success: boolean; user?: Profile; message?: string }> {
    if (this.client) {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .maybeSingle();

      if (error) return { success: false, message: error.message };
      if (!data) return { success: false, message: `Profile with email ${email} and role ${role} not found.` };
      return { success: true, user: data as Profile };
    } else {
      const db = readLocalDb();
      const user = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.role === role);
      if (user) {
        return { success: true, user };
      }
      return { success: false, message: `Predefined account for ${email} with role ${role} not found.` };
    }
  }

  async register(email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female'): Promise<{ success: boolean; user?: Profile; message?: string }> {
    if (this.client) {
      const { data: existing } = await this.client.from('profiles').select('id').eq('email', email).maybeSingle();
      if (existing) return { success: false, message: 'Email already registered.' };

      const id = 'usr_' + Math.random().toString(36).substring(2, 12);
      const newProfile = { id, name, email, role, phone, gender, created_at: new Date().toISOString() };

      const { data, error } = await this.client.from('profiles').insert([newProfile]).select().single();
      if (error) return { success: false, message: error.message };
      return { success: true, user: data as Profile };
    } else {
      const db = readLocalDb();
      if (db.profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
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

      db.profiles.push(newUser);
      writeLocalDb(db);

      // Auto allocation logic in local storage mode
      if (role === 'student' && gender) {
        const freeRoom = db.rooms.find(r => {
          const hostel = db.hostels.find(h => h.id === r.hostel_id);
          const hostelType = hostel ? (hostel.type || (hostel.name.toLowerCase().includes('girls') ? 'girls' : 'boys')) : 'boys';
          const matchesGender = gender === 'female' ? hostelType === 'girls' : hostelType === 'boys';
          return r.occupied < r.capacity && matchesGender;
        });

        if (freeRoom) {
          freeRoom.occupied += 1;
          db.allocations.push({
            id: 'alloc_' + Math.random().toString(36).substring(2, 9),
            student_id: newUser.id,
            room_id: freeRoom.id,
            assigned_at: new Date().toISOString(),
            status: 'active'
          });

          // Notify wardens
          const matchingHostel = db.hostels.find(h => h.id === freeRoom.hostel_id);
          const wardens = db.profiles.filter(p => p.role === 'warden');
          for (const w of wardens) {
            db.notifications.unshift({
              id: 'not_' + Math.random().toString(36).substring(2, 9),
              user_id: w.id,
              title: 'New Room Auto-Allocation',
              message: `Student ${name} (${gender}) registered and was auto-allocated Room ${freeRoom.room_number} in ${matchingHostel?.name || 'Hostel Block'}.`,
              type: 'announcement',
              is_read: false,
              created_at: new Date().toISOString()
            });
          }
          writeLocalDb(db);
        }
      }

      return { success: true, user: newUser };
    }
  }

  async getCurrentUser(userId: string): Promise<Profile | null> {
    if (this.client) {
      const { data } = await this.client.from('profiles').select('*').eq('id', userId).maybeSingle();
      return data as Profile;
    } else {
      const db = readLocalDb();
      return db.profiles.find(p => p.id === userId) || null;
    }
  }

  // -------------------------------------------------------------
  // HOSTELS & ROOMS
  // -------------------------------------------------------------
  async getHostels(): Promise<Hostel[]> {
    if (this.client) {
      const { data } = await this.client.from('hostels').select('*').order('name');
      return data || [];
    } else {
      const db = readLocalDb();
      return db.hostels;
    }
  }

  async addHostel(name: string, location?: string, type?: 'boys' | 'girls'): Promise<Hostel> {
    const finalType = type || (name.toLowerCase().includes('girls') ? 'girls' : 'boys');
    if (this.client) {
      const { data, error } = await this.client.from('hostels').insert([{ name, location, type: finalType }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDb();
      const newHostel: Hostel = {
        id: 'hostel_' + Math.random().toString(36).substring(2, 9),
        name,
        type: finalType,
        location,
        created_at: new Date().toISOString()
      };
      db.hostels.push(newHostel);
      writeLocalDb(db);
      return newHostel;
    }
  }

  async getRooms(hostelId?: string): Promise<Room[]> {
    if (this.client) {
      let query = this.client.from('rooms').select('*, hostels(name)');
      if (hostelId) query = query.eq('hostel_id', hostelId);
      const { data } = await query;
      return (data || []).map(r => ({
        ...r,
        hostel_name: r.hostels ? r.hostels.name : 'Unknown'
      }));
    } else {
      const db = readLocalDb();
      let list = db.rooms.map(r => {
        const hostel = db.hostels.find(h => h.id === r.hostel_id);
        return { ...r, hostel_name: hostel ? hostel.name : 'Unknown Hostel' };
      });
      if (hostelId) {
        list = list.filter(r => r.hostel_id === hostelId);
      }
      return list;
    }
  }

  async addRoom(hostelId: string, roomNumber: string, floor: number, capacity: number): Promise<Room> {
    if (this.client) {
      const { data, error } = await this.client.from('rooms').insert([{ hostel_id: hostelId, room_number: roomNumber, floor, capacity }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDb();
      const newRoom: Room = {
        id: 'room_' + Math.random().toString(36).substring(2, 9),
        hostel_id: hostelId,
        room_number: roomNumber,
        floor,
        capacity,
        occupied: 0,
        created_at: new Date().toISOString()
      };
      db.rooms.push(newRoom);
      writeLocalDb(db);
      return newRoom;
    }
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    if (this.client) {
      const { data, error } = await this.client.from('rooms').update(updates).eq('id', roomId).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDb();
      const idx = db.rooms.findIndex(r => r.id === roomId);
      if (idx === -1) throw new Error('Room not found');
      db.rooms[idx] = { ...db.rooms[idx], ...updates };
      writeLocalDb(db);
      return db.rooms[idx];
    }
  }

  // -------------------------------------------------------------
  // ROOM ALLOCATIONS
  // -------------------------------------------------------------
  async getAllocations(): Promise<Allocation[]> {
    if (this.client) {
      const { data } = await this.client.from('allocations').select('*, student:profiles(name, email, phone), room:rooms(*, hostels(name))');
      return (data || []).map(a => ({
        ...a,
        student: a.student ? { name: a.student.name, email: a.student.email, phone: a.student.phone } : undefined,
        room: a.room ? { room_number: a.room.room_number, floor: a.room.floor, hostel_name: a.room.hostels?.name } : undefined
      }));
    } else {
      const db = readLocalDb();
      return db.allocations.map(a => {
        const student = db.profiles.find(p => p.id === a.student_id);
        const room = db.rooms.find(r => r.id === a.room_id);
        const hostel = room ? db.hostels.find(h => h.id === room.hostel_id) : null;
        return {
          ...a,
          student: student ? { name: student.name, email: student.email, phone: student.phone } : undefined,
          room: room ? { room_number: room.room_number, floor: room.floor, hostel_name: hostel?.name } : undefined
        };
      });
    }
  }

  async allocateRoom(studentId: string, roomId: string): Promise<Allocation> {
    if (this.client) {
      // 1. Validate student and room details
      const { data: student, error: studentErr } = await this.client.from('profiles').select('name, gender').eq('id', studentId).single();
      if (studentErr || !student) throw new Error('Student profile not found');

      const { data: room, error: roomErr } = await this.client.from('rooms').select('capacity, occupied, room_number, floor, hostel_id').eq('id', roomId).single();
      if (roomErr || !room) throw new Error('Room not found');
      if (room.occupied >= room.capacity) throw new Error('Room is full');

      const { data: hostel, error: hostelErr } = await this.client.from('hostels').select('name, type').eq('id', room.hostel_id).single();
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
      const { data: oldAlloc } = await this.client.from('allocations').select('*').eq('student_id', studentId).eq('status', 'active').maybeSingle();
      if (oldAlloc) {
        await this.client.from('allocations').update({ status: 'vacated' }).eq('id', oldAlloc.id);
        const { data: oldRoom } = await this.client.from('rooms').select('occupied').eq('id', oldAlloc.room_id).single();
        if (oldRoom) {
          await this.client.from('rooms').update({ occupied: Math.max(0, oldRoom.occupied - 1) }).eq('id', oldAlloc.room_id);
        }
      }

      // 3. Insert new allocation
      const { data: newAlloc, error: allocErr } = await this.client.from('allocations').insert([{ student_id: studentId, room_id: roomId, status: 'active' }]).select().single();
      if (allocErr) throw allocErr;

      // 4. Update new room occupancy
      await this.client.from('rooms').update({ occupied: room.occupied + 1 }).eq('id', roomId);

      // 5. Create notification for student
      await this.addNotification(studentId, 'Room Allocated', `You have been allocated room ${room.room_number} (Floor ${room.floor})`, 'announcement');

      // 6. Notify all wardens
      const { data: wardens } = await this.client.from('profiles').select('id').eq('role', 'warden');
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
    } else {
      const db = readLocalDb();
      
      const room = db.rooms.find(r => r.id === roomId);
      if (!room) throw new Error('Room not found');
      if (room.occupied >= room.capacity) throw new Error('Room is already fully occupied');

      const student = db.profiles.find(p => p.id === studentId);
      if (!student) throw new Error('Student profile not found');

      const hostel = db.hostels.find(h => h.id === room.hostel_id);
      if (!hostel) throw new Error('Hostel block not found');

      const studentGender = student.gender || 'male';
      const hostelType = hostel.type || (hostel.name.toLowerCase().includes('girls') ? 'girls' : 'boys');
      if (studentGender === 'male' && hostelType !== 'boys') {
        throw new Error(`Cannot allocate Male student (${student.name}) to a Girls Hostel block (${hostel.name}).`);
      }
      if (studentGender === 'female' && hostelType !== 'girls') {
        throw new Error(`Cannot allocate Female student (${student.name}) to a Boys Hostel block (${hostel.name}).`);
      }

      // Vacate active allocations for this student first
      const activeIdx = db.allocations.findIndex(a => a.student_id === studentId && a.status === 'active');
      if (activeIdx !== -1) {
        const oldRoomId = db.allocations[activeIdx].room_id;
        db.allocations[activeIdx].status = 'vacated';
        const oldRoom = db.rooms.find(r => r.id === oldRoomId);
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
      db.allocations.push(newAlloc);

      // Create notification for the student
      db.notifications.unshift({
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: studentId,
        title: 'Room Allocated',
        message: `You have been allocated room ${room.room_number} (Floor ${room.floor})`,
        type: 'announcement',
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Notify wardens
      const wardens = db.profiles.filter(p => p.role === 'warden');
      for (const w of wardens) {
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: w.id,
          title: 'Resident Allocated',
          message: `Student ${student.name} (${studentGender}) has been allocated to Room ${room.room_number} in ${hostel.name}.`,
          type: 'announcement',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      writeLocalDb(db);
      return newAlloc;
    }
  }

  async vacateRoom(allocationId: string): Promise<boolean> {
    if (this.client) {
      const { data: alloc, error } = await this.client.from('allocations').select('*').eq('id', allocationId).single();
      if (error || !alloc) return false;

      if (alloc.status === 'active') {
        await this.client.from('allocations').update({ status: 'vacated' }).eq('id', allocationId);
        const { data: room } = await this.client.from('rooms').select('occupied').eq('id', alloc.room_id).single();
        if (room) {
          await this.client.from('rooms').update({ occupied: Math.max(0, room.occupied - 1) }).eq('id', alloc.room_id);
        }
        await this.addNotification(alloc.student_id, 'Room Vacated', 'Your room allocation has been vacated.', 'announcement');
      }
      return true;
    } else {
      const db = readLocalDb();
      const idx = db.allocations.findIndex(a => a.id === allocationId);
      if (idx === -1) return false;

      const alloc = db.allocations[idx];
      if (alloc.status === 'active') {
        alloc.status = 'vacated';
        const room = db.rooms.find(r => r.id === alloc.room_id);
        if (room) {
          room.occupied = Math.max(0, room.occupied - 1);
        }
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: alloc.student_id,
          title: 'Room Vacated',
          message: 'Your room assignment has been vacated.',
          type: 'announcement',
          is_read: false,
          created_at: new Date().toISOString()
        });
        writeLocalDb(db);
      }
      return true;
    }
  }

  // -------------------------------------------------------------
  // ATTENDANCE
  // -------------------------------------------------------------
  async recordAttendance(studentId: string, status: 'present' | 'absent' | 'late', checkIn?: string, checkOut?: string): Promise<Attendance> {
    if (this.client) {
      const date = new Date().toISOString().split('T')[0];
      const { data: existing } = await this.client.from('attendance').select('id, check_in').eq('student_id', studentId).eq('date', date).maybeSingle();
      
      let res;
      if (existing) {
        res = await this.client.from('attendance').update({
          status,
          check_in: checkIn || existing.check_in,
          check_out: checkOut || undefined
        }).eq('id', existing.id).select().single();
      } else {
        res = await this.client.from('attendance').insert([{
          student_id: studentId,
          date,
          status,
          check_in: checkIn || new Date().toISOString(),
          check_out: checkOut || undefined
        }]).select().single();
      }
      if (res.error) throw res.error;
      return res.data;
    } else {
      const db = readLocalDb();
      const date = new Date().toISOString().split('T')[0];
      const idx = db.attendance.findIndex(a => a.student_id === studentId && a.date === date);

      const record: Attendance = {
        id: idx !== -1 ? db.attendance[idx].id : 'att_' + Math.random().toString(36).substring(2, 9),
        student_id: studentId,
        date,
        status,
        check_in: checkIn || (idx !== -1 ? db.attendance[idx].check_in : new Date().toISOString()),
        check_out: checkOut || (idx !== -1 ? db.attendance[idx].check_out : undefined)
      };

      if (idx !== -1) {
        db.attendance[idx] = record;
      } else {
        db.attendance.push(record);
      }
      writeLocalDb(db);
      return record;
    }
  }

  async getAttendance(studentId?: string, date?: string): Promise<Attendance[]> {
    if (this.client) {
      let query = this.client.from('attendance').select('*, student:profiles(name, email)');
      if (studentId) query = query.eq('student_id', studentId);
      if (date) query = query.eq('date', date);
      const { data } = await query;
      return (data || []).map(a => ({
        ...a,
        student_name: a.student ? a.student.name : 'Unknown student',
        student_roll: a.student ? a.student.email.split('@')[0].toUpperCase() : 'N/A'
      }));
    } else {
      const db = readLocalDb();
      let list = db.attendance.map(a => {
        const student = db.profiles.find(p => p.id === a.student_id);
        return {
          ...a,
          student_name: student ? student.name : 'Unknown Student',
          student_roll: student ? student.email.split('@')[0].toUpperCase() : 'N/A'
        };
      });
      if (studentId) list = list.filter(a => a.student_id === studentId);
      if (date) list = list.filter(a => a.date === date);
      return list;
    }
  }

  // -------------------------------------------------------------
  // COMPLAINTS
  // -------------------------------------------------------------
  async getComplaints(studentId?: string, assignedTo?: string): Promise<Complaint[]> {
    if (this.client) {
      let query = this.client.from('complaints').select('*, student:profiles!complaints_student_id_fkey(name), assigned:profiles!complaints_assigned_to_fkey(name)');
      if (studentId) query = query.eq('student_id', studentId);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);
      const { data } = await query;
      return (data || []).map(c => ({
        ...c,
        student_name: c.student ? c.student.name : 'Unknown Student',
        assigned_to_name: c.assigned ? c.assigned.name : undefined
      }));
    } else {
      const db = readLocalDb();
      let list = db.complaints.map(c => {
        const student = db.profiles.find(p => p.id === c.student_id);
        const assigned = db.profiles.find(p => p.id === c.assigned_to);
        return {
          ...c,
          student_name: student ? student.name : 'Unknown Student',
          assigned_to_name: assigned ? assigned.name : undefined
        };
      });
      if (studentId) list = list.filter(c => c.student_id === studentId);
      if (assignedTo) list = list.filter(c => c.assigned_to === assignedTo);
      return list;
    }
  }

  async addComplaint(studentId: string, category: string, description: string): Promise<Complaint> {
    if (this.client) {
      const { data, error } = await this.client.from('complaints').insert([{ student_id: studentId, category, description, status: 'pending' }]).select().single();
      if (error) throw error;

      // Notify wardens/admins
      const { data: staff } = await this.client.from('profiles').select('id').in('role', ['warden', 'admin']);
      if (staff) {
        const { data: student } = await this.client.from('profiles').select('name').eq('id', studentId).single();
        for (const member of staff) {
          await this.addNotification(member.id, 'New Complaint Raised', `Student ${student?.name || 'Unknown'} raised complaint under ${category}`, 'complaint');
        }
      }
      return data;
    } else {
      const db = readLocalDb();
      const newComp: Complaint = {
        id: 'comp_' + Math.random().toString(36).substring(2, 9),
        student_id: studentId,
        category,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.complaints.push(newComp);

      // Notify wardens/admins
      const student = db.profiles.find(p => p.id === studentId);
      const staff = db.profiles.filter(p => p.role === 'warden' || p.role === 'admin');
      for (const member of staff) {
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: member.id,
          title: 'New Complaint Raised',
          message: `Student ${student?.name || 'Unknown'} raised complaint under ${category}`,
          type: 'complaint',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      writeLocalDb(db);
      return newComp;
    }
  }

  async updateComplaintStatus(complaintId: string, status: Complaint['status'], assignedTo?: string, resolvedAt?: string): Promise<Complaint> {
    if (this.client) {
      const updates: any = { status };
      if (assignedTo !== undefined) updates.assigned_to = assignedTo;
      if (resolvedAt !== undefined) updates.resolved_at = resolvedAt;
      
      const { data, error } = await this.client.from('complaints').update(updates).eq('id', complaintId).select().single();
      if (error) throw error;
      await this.addNotification(data.student_id, 'Complaint Status Updated', `Your complaint ticket status is now ${status.toUpperCase()}`, 'complaint');
      return data;
    } else {
      const db = readLocalDb();
      const idx = db.complaints.findIndex(c => c.id === complaintId);
      if (idx === -1) throw new Error('Complaint not found');
      
      db.complaints[idx].status = status;
      if (assignedTo !== undefined) db.complaints[idx].assigned_to = assignedTo;
      if (resolvedAt !== undefined) db.complaints[idx].resolved_at = resolvedAt;

      db.notifications.unshift({
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: db.complaints[idx].student_id,
        title: 'Complaint Status Updated',
        message: `Your complaint ticket status is now ${status.toUpperCase()}`,
        type: 'complaint',
        is_read: false,
        created_at: new Date().toISOString()
      });

      writeLocalDb(db);
      return db.complaints[idx];
    }
  }

  // -------------------------------------------------------------
  // VISITORS
  // -------------------------------------------------------------
  async getVisitors(studentId?: string): Promise<Visitor[]> {
    if (this.client) {
      let query = this.client.from('visitors').select('*, student:profiles(name)');
      if (studentId) query = query.eq('student_id', studentId);
      const { data } = await query;
      return (data || []).map(v => ({
        ...v,
        student_name: v.student ? v.student.name : 'Unknown Student'
      }));
    } else {
      const db = readLocalDb();
      let list = db.visitors.map(v => {
        const student = db.profiles.find(p => p.id === v.student_id);
        const alloc = db.allocations.find(a => a.student_id === v.student_id && a.status === 'active');
        const room = alloc ? db.rooms.find(r => r.id === alloc.room_id) : null;
        return {
          ...v,
          student_name: student ? student.name : 'Unknown Student',
          room_number: room ? room.room_number : 'N/A'
        };
      });
      if (studentId) list = list.filter(v => v.student_id === studentId);
      return list;
    }
  }

  async addVisitor(visitorName: string, phone: string, studentId: string, purpose?: string): Promise<Visitor> {
    if (this.client) {
      const { data, error } = await this.client.from('visitors').insert([{ visitor_name: visitorName, phone, student_id: studentId, purpose, status: 'pending' }]).select().single();
      if (error) throw error;
      await this.addNotification(studentId, 'Visitor Approval Required', `${visitorName} is requesting entry to see you.`, 'visitor');
      return data;
    } else {
      const db = readLocalDb();
      const newVis: Visitor = {
        id: 'vis_' + Math.random().toString(36).substring(2, 9),
        visitor_name: visitorName,
        phone,
        student_id: studentId,
        purpose,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.visitors.push(newVis);
      db.notifications.unshift({
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: studentId,
        title: 'Visitor Approval Required',
        message: `${visitorName} is requesting entry to see you.`,
        type: 'visitor',
        is_read: false,
        created_at: new Date().toISOString()
      });
      writeLocalDb(db);
      return newVis;
    }
  }

  async updateVisitorStatus(visitorId: string, status: Visitor['status'], entryTime?: string, exitTime?: string): Promise<Visitor> {
    if (this.client) {
      const updates: any = { status };
      if (entryTime !== undefined) updates.entry_time = entryTime;
      if (exitTime !== undefined) updates.exit_time = exitTime;

      const { data, error } = await this.client.from('visitors').update(updates).eq('id', visitorId).select().single();
      if (error) throw error;

      if (status === 'approved') {
        await this.addNotification(data.student_id, 'Visitor Approved', `Your visitor ${data.visitor_name} has been approved. Check-in registered.`, 'visitor');
      }
      return data;
    } else {
      const db = readLocalDb();
      const idx = db.visitors.findIndex(v => v.id === visitorId);
      if (idx === -1) throw new Error('Visitor log not found');

      db.visitors[idx].status = status;
      if (entryTime !== undefined) db.visitors[idx].entry_time = entryTime;
      if (exitTime !== undefined) db.visitors[idx].exit_time = exitTime;

      // Notify security
      const security = db.profiles.filter(p => p.role === 'security');
      for (const guard of security) {
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: guard.id,
          title: 'Visitor Status Updated',
          message: `Visitor ${db.visitors[idx].visitor_name} status updated to ${status}`,
          type: 'visitor',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      if (status === 'approved') {
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: db.visitors[idx].student_id,
          title: 'Visitor Approved',
          message: `Your visitor ${db.visitors[idx].visitor_name} has been approved. Check-in registered.`,
          type: 'visitor',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      writeLocalDb(db);
      return db.visitors[idx];
    }
  }

  // -------------------------------------------------------------
  // FEES
  // -------------------------------------------------------------
  async getFees(studentId?: string): Promise<Fee[]> {
    if (this.client) {
      let query = this.client.from('fees').select('*, student:profiles(name)');
      if (studentId) query = query.eq('student_id', studentId);
      const { data } = await query;
      return (data || []).map(f => ({
        ...f,
        student_name: f.student ? f.student.name : 'Unknown Student'
      }));
    } else {
      const db = readLocalDb();
      let list = db.fees.map(f => {
        const student = db.profiles.find(p => p.id === f.student_id);
        return {
          ...f,
          student_name: student ? student.name : 'Unknown Student'
        };
      });
      if (studentId) list = list.filter(f => f.student_id === studentId);
      return list;
    }
  }

  async addFee(studentId: string, amount: number, dueDate: string): Promise<Fee> {
    if (this.client) {
      const { data, error } = await this.client.from('fees').insert([{ student_id: studentId, amount, due_date: dueDate, payment_status: 'unpaid' }]).select().single();
      if (error) throw error;
      await this.addNotification(studentId, 'Fees Invoiced', `New hostel fee of Rs. ${amount} generated. Due: ${dueDate}`, 'fee');
      return data;
    } else {
      const db = readLocalDb();
      const newFee: Fee = {
        id: 'fee_' + Math.random().toString(36).substring(2, 9),
        student_id: studentId,
        amount,
        due_date: dueDate,
        payment_status: 'unpaid',
        created_at: new Date().toISOString()
      };
      db.fees.push(newFee);
      db.notifications.unshift({
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: studentId,
        title: 'New Fee Generated',
        message: `A new hostel fee invoice of Rs. ${amount} has been raised. Due: ${dueDate}`,
        type: 'fee',
        is_read: false,
        created_at: new Date().toISOString()
      });
      writeLocalDb(db);
      return newFee;
    }
  }

  async payFee(feeId: string): Promise<Fee> {
    if (this.client) {
      const { data, error } = await this.client.from('fees').update({ payment_status: 'paid', paid_at: new Date().toISOString(), receipt_url: '#' }).eq('id', feeId).select().single();
      if (error) throw error;
      await this.addNotification(data.student_id, 'Fee Paid', `Fee payment of Rs. ${data.amount} successfully processed.`, 'fee');
      return data;
    } else {
      const db = readLocalDb();
      const idx = db.fees.findIndex(f => f.id === feeId);
      if (idx === -1) throw new Error('Fee record not found');

      db.fees[idx].payment_status = 'paid';
      db.fees[idx].paid_at = new Date().toISOString();
      db.fees[idx].receipt_url = '#';

      db.notifications.unshift({
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: db.fees[idx].student_id,
        title: 'Fee Payment Successful',
        message: `Payment of Rs. ${db.fees[idx].amount} received. Receipt is ready.`,
        type: 'fee',
        is_read: false,
        created_at: new Date().toISOString()
      });

      writeLocalDb(db);
      return db.fees[idx];
    }
  }

  // -------------------------------------------------------------
  // MESS MENU & FEEDBACK
  // -------------------------------------------------------------
  async getMessMenu(): Promise<MessMenu[]> {
    if (this.client) {
      const { data } = await this.client.from('mess_menu').select('*').order('created_at');
      return data || [];
    } else {
      const db = readLocalDb();
      return db.mess_menu;
    }
  }

  async updateMessMenu(dayOfWeek: string, breakfast: string, lunch: string, dinner: string): Promise<MessMenu> {
    if (this.client) {
      const { data: existing } = await this.client.from('mess_menu').select('id').eq('day_of_week', dayOfWeek).maybeSingle();
      let res;
      if (existing) {
        res = await this.client.from('mess_menu').update({ breakfast, lunch, dinner }).eq('id', existing.id).select().single();
      } else {
        res = await this.client.from('mess_menu').insert([{ day_of_week: dayOfWeek, breakfast, lunch, dinner }]).select().single();
      }
      if (res.error) throw res.error;
      return res.data;
    } else {
      const db = readLocalDb();
      const idx = db.mess_menu.findIndex(m => m.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
      const menu: MessMenu = {
        id: idx !== -1 ? db.mess_menu[idx].id : 'menu_' + Math.random().toString(36).substring(2, 9),
        day_of_week: dayOfWeek,
        breakfast,
        lunch,
        dinner,
        created_at: new Date().toISOString()
      };
      if (idx !== -1) {
        db.mess_menu[idx] = menu;
      } else {
        db.mess_menu.push(menu);
      }
      writeLocalDb(db);
      return menu;
    }
  }

  async getMessFeedback(mealType?: string, date?: string): Promise<MessFeedback[]> {
    if (this.client) {
      let query = this.client.from('mess_feedback').select('*, student:profiles(name)');
      if (mealType) query = query.eq('meal_type', mealType);
      if (date) query = query.eq('date', date);
      const { data } = await query;
      return (data || []).map(f => ({
        ...f,
        student_name: f.student ? f.student.name : 'Unknown Student'
      }));
    } else {
      const db = readLocalDb();
      let list = db.mess_feedback.map(f => {
        const student = db.profiles.find(p => p.id === f.student_id);
        return {
          ...f,
          student_name: student ? student.name : 'Unknown Student'
        };
      });
      if (mealType) list = list.filter(f => f.meal_type === mealType);
      if (date) list = list.filter(f => f.date === date);
      return list;
    }
  }

  async addMessFeedback(studentId: string, mealType: 'breakfast' | 'lunch' | 'dinner', rating: number, comment?: string): Promise<MessFeedback> {
    if (this.client) {
      const { data, error } = await this.client.from('mess_feedback').insert([{
        student_id: studentId,
        meal_type: mealType,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0]
      }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDb();
      const newFeedback: MessFeedback = {
        id: 'fb_' + Math.random().toString(36).substring(2, 9),
        student_id: studentId,
        meal_type: mealType,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      db.mess_feedback.push(newFeedback);

      // Notify Mess Manager
      const messManagers = db.profiles.filter(p => p.role === 'mess_manager');
      for (const mgr of messManagers) {
        db.notifications.unshift({
          id: 'not_' + Math.random().toString(36).substring(2, 9),
          user_id: mgr.id,
          title: 'New Meal Feedback',
          message: `A student rated ${mealType} as ${rating} stars.`,
          type: 'announcement',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      writeLocalDb(db);
      return newFeedback;
    }
  }

  // -------------------------------------------------------------
  // SYSTEM NOTIFICATIONS
  // -------------------------------------------------------------
  async getNotifications(userId: string): Promise<Notification[]> {
    if (this.client) {
      const { data } = await this.client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    } else {
      const db = readLocalDb();
      return db.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type']): Promise<Notification> {
    if (this.client) {
      const { data, error } = await this.client.from('notifications').insert([{ user_id: userId, title, message, type, is_read: false }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDb();
      const newNotif: Notification = {
        id: 'not_' + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      };
      db.notifications.unshift(newNotif);
      writeLocalDb(db);
      return newNotif;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    if (this.client) {
      const { error } = await this.client.from('notifications').update({ is_read: true }).eq('id', notificationId);
      return !error;
    } else {
      const db = readLocalDb();
      const idx = db.notifications.findIndex(n => n.id === notificationId);
      if (idx === -1) return false;
      db.notifications[idx].is_read = true;
      writeLocalDb(db);
      return true;
    }
  }
}

// -------------------------------------------------------------
// SECURE REQUEST SCOPED INITIALIZER
// -------------------------------------------------------------
export function getDbServer(req?: Request | null): DbServerInstance {
  if (!req) {
    return new DbServerInstance();
  }
  const headers = req.headers;
  const url = headers.get('x-supabase-url');
  const key = headers.get('x-supabase-anon-key');
  return new DbServerInstance(url, key);
}
