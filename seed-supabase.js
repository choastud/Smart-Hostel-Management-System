// AuraHost - Supabase Database Seeder
// Run this script using `node seed-supabase.js` to populate your live database.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Could not find .env.local file. Please create it first.");
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_PROFILES = [
  { id: 'usr_student1', name: 'Rahul Sharma', email: 'student@hostel.com', role: 'student', gender: 'male', phone: '9876543210' },
  { id: 'usr_student2', name: 'Sneha Reddy', email: 'student2@hostel.com', role: 'student', gender: 'female', phone: '9876543211' },
  { id: 'usr_admin', name: 'Alok Gupta (Admin)', email: 'admin@hostel.com', role: 'admin', gender: 'male', phone: '9876543212' },
  { id: 'usr_warden', name: 'Dr. K.P. Singh (Warden)', email: 'warden@hostel.com', role: 'warden', gender: 'male', phone: '9876543213' },
  { id: 'usr_security', name: 'Guard Ram Prasad', email: 'security@hostel.com', role: 'security', gender: 'male', phone: '9876543214' },
  { id: 'usr_mess', name: 'Chef Ramesh Chandra', email: 'mess@hostel.com', role: 'mess_manager', gender: 'male', phone: '9876543215' },
];

const SEED_HOSTELS = [
  { id: 'hostel_boys_a', name: 'Boys Hostel - Block A', type: 'boys', location: 'North Campus' },
  { id: 'hostel_girls_b', name: 'Girls Hostel - Block B', type: 'girls', location: 'South Campus' },
];

const SEED_ROOMS = [
  { id: 'room_101', hostel_id: 'hostel_boys_a', room_number: '101', floor: 1, capacity: 3, occupied: 1 },
  { id: 'room_102', hostel_id: 'hostel_boys_a', room_number: '102', floor: 1, capacity: 3, occupied: 0 },
  { id: 'room_201', hostel_id: 'hostel_girls_b', room_number: '201', floor: 2, capacity: 2, occupied: 1 },
];

const SEED_ALLOCATIONS = [
  { id: 'alloc_1', student_id: 'usr_student1', room_id: 'room_101', status: 'active' },
  { id: 'alloc_2', student_id: 'usr_student2', room_id: 'room_201', status: 'active' },
];

const SEED_ATTENDANCE = [
  { id: 'att_1', student_id: 'usr_student1', date: new Date().toISOString().split('T')[0], status: 'present' },
  { id: 'att_2', student_id: 'usr_student2', date: new Date().toISOString().split('T')[0], status: 'late' },
];

const SEED_COMPLAINTS = [
  { id: 'comp_1', student_id: 'usr_student1', category: 'Plumbing', description: 'Leaking tap in room bathroom.', status: 'pending' },
  { id: 'comp_2', student_id: 'usr_student2', category: 'Electrical', description: 'Fan making loud noise and rotating slowly.', status: 'in_progress', assigned_to: 'usr_warden' },
];

const SEED_VISITORS = [
  { id: 'vis_1', visitor_name: 'Suresh Sharma', phone: '9888888888', student_id: 'usr_student1', purpose: 'Father visiting', status: 'approved' },
];

const SEED_FEES = [
  { id: 'fee_1', student_id: 'usr_student1', amount: 25000, due_date: '2026-06-30', payment_status: 'unpaid' },
  { id: 'fee_2', student_id: 'usr_student2', amount: 25000, due_date: '2026-05-15', payment_status: 'paid', paid_at: new Date().toISOString(), receipt_url: '#' },
];

const SEED_MESS_MENU = [
  { id: 'menu_1', day_of_week: 'Monday', breakfast: 'Idli, Sambar, Tea', lunch: 'Rice, Dal, Veg Kadhai, Curd', dinner: 'Roti, Paneer Masala, Kheer' },
  { id: 'menu_2', day_of_week: 'Tuesday', breakfast: 'Poha, Sprouts, Milk', lunch: 'Rice, Rajma, Aloo Gobhi, Salad', dinner: 'Roti, Mix Veg Sabzi, Custard' },
  { id: 'menu_3', day_of_week: 'Wednesday', breakfast: 'Aloo Paratha, Curd', lunch: 'Jeera Rice, Chole, Raita', dinner: 'Veg Biryani, Salan, Ice Cream' },
  { id: 'menu_4', day_of_week: 'Thursday', breakfast: 'Bread Toast, Omelette/Banana, Juice', lunch: 'Rice, Dal Fry, Bhindi Masala', dinner: 'Roti, Egg Curry/Paneer, Gulab Jamun' },
  { id: 'menu_5', day_of_week: 'Friday', breakfast: 'Upma, Coconut Chutney, Tea', lunch: 'Rice, Sambhar, Ivy Gourd Fry, Curd', dinner: 'Roti, Dal Makhani, Fruit Salad' },
  { id: 'menu_6', day_of_week: 'Saturday', breakfast: 'Puri, Aloo Dum, Tea', lunch: 'Khichdi, Papad, Pickle, Chokha', dinner: 'Roti, Methi Chaman, Sooji Halwa' },
  { id: 'menu_7', day_of_week: 'Sunday', breakfast: 'Sandwich, Cornflakes, Coffee', lunch: 'Veg Pulav, Shahi Paneer, Raita', dinner: 'Butter Naan, Kadai Chicken/Veg, Sweet' },
];

const SEED_MESS_FEEDBACK = [
  { id: 'fb_1', student_id: 'usr_student1', meal_type: 'breakfast', rating: 4, comment: 'Nice hot idlis!', date: new Date().toISOString().split('T')[0] },
  { id: 'fb_2', student_id: 'usr_student2', meal_type: 'lunch', rating: 3, comment: 'Rajma was a bit salty.', date: new Date().toISOString().split('T')[0] },
];

const SEED_NOTIFICATIONS = [
  { id: 'not_1', user_id: 'usr_student1', title: 'Visitor Arrived', message: 'Your father Suresh Sharma is at the main gate. Please approve entry.', type: 'visitor', is_read: false },
  { id: 'not_2', user_id: 'usr_student1', title: 'Fees Due', message: 'Hostel fee of Rs. 25000 is due by June 30.', type: 'fee', is_read: false },
  { id: 'not_3', user_id: 'usr_student2', title: 'Complaint Assigned', message: 'Warden has assigned electrical team to fix your room fan.', type: 'complaint', is_read: false },
];

async function seedTable(name, records) {
  console.log(`Seeding table '${name}'...`);
  const { data, error } = await supabase.from(name).upsert(records);
  if (error) {
    console.error(`Error seeding table '${name}':`, error.message);
    return false;
  }
  console.log(`Successfully seeded '${name}' with ${records.length} records.`);
  return true;
}

async function startSeeding() {
  try {
    await seedTable('profiles', SEED_PROFILES);
    await seedTable('hostels', SEED_HOSTELS);
    await seedTable('rooms', SEED_ROOMS);
    await seedTable('allocations', SEED_ALLOCATIONS);
    await seedTable('attendance', SEED_ATTENDANCE);
    await seedTable('complaints', SEED_COMPLAINTS);
    await seedTable('visitors', SEED_VISITORS);
    await seedTable('fees', SEED_FEES);
    await seedTable('mess_menu', SEED_MESS_MENU);
    await seedTable('mess_feedback', SEED_MESS_FEEDBACK);
    await seedTable('notifications', SEED_NOTIFICATIONS);
    console.log("\nDatabase seeding completed successfully!");
  } catch (e) {
    console.error("Seeding failed with exception:", e.message);
  }
}

startSeeding();
