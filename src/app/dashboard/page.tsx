'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { getDbService } from '../../services/db';
import { Room, Profile, Complaint, Visitor, Fee, MessMenu, MessFeedback } from '../../types';
import DashboardCharts from '../../components/DashboardCharts';
import { 
  DoorOpen, Users, AlertTriangle, UserCheck, CreditCard, 
  ArrowRight, Shield, Zap, Sparkles, Home, CalendarCheck, Utensils, Clock, Check, ShieldCheck, ChevronRight, XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    occupiedBeds: 0,
    totalCapacity: 0,
    totalStudents: 0,
    pendingComplaints: 0,
    activeVisitors: 0,
    paidFees: 0,
    totalFees: 0,
  });

  const [roomsChart, setRoomsChart] = useState<{ hostel: string; capacity: number; occupied: number }[]>([]);
  const [complaintsChart, setComplaintsChart] = useState<{ name: string; value: number }[]>([]);
  const [feesChart, setFeesChart] = useState<{ name: string; value: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: string; title: string; desc: string; type: string }[]>([]);

  // Role-specific states
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [myRoommates, setMyRoommates] = useState<Profile[]>([]);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [myFees, setMyFees] = useState<Fee[]>([]);
  const [myVisitors, setMyVisitors] = useState<Visitor[]>([]);
  const [attendedToday, setAttendedToday] = useState(false);

  const [securityVisitors, setSecurityVisitors] = useState<Visitor[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);

  const [messMenu, setMessMenu] = useState<MessMenu[]>([]);
  const [messFeedback, setMessFeedback] = useState<MessFeedback[]>([]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      // 1. Fetch common data
      const rooms = await db.getRooms();
      const hostels = await db.getHostels();
      const allocations = await db.getAllocations();
      const activeAllocations = allocations.filter(a => a.status === 'active');

      // 2. Load Student Portal Data
      if (user.role === 'student') {
        const myAlloc = allocations.find(a => a.student_id === user.id && a.status === 'active');
        let roomObj: Room | null = null;
        let roommatesList: Profile[] = [];
        if (myAlloc) {
          roomObj = rooms.find(rm => rm.id === myAlloc.room_id) || null;
          if (roomObj) {
            const roommateIds = allocations
              .filter(a => a.room_id === roomObj!.id && a.student_id !== user.id && a.status === 'active')
              .map(a => a.student_id);
            
            let allProfiles: Profile[] = [];
            if (db.isSupabaseActive()) {
              const client = (db as any).getSupabaseClient?.();
              if (client) {
                const { data } = await client.from('profiles').select('*');
                allProfiles = data || [];
              }
            } else {
              allProfiles = JSON.parse(localStorage.getItem('shms_profiles') || '[]');
            }
            roommatesList = allProfiles.filter(p => roommateIds.includes(p.id));
          }
        }
        setMyRoom(roomObj);
        setMyRoommates(roommatesList);

        const pComplaints = await db.getComplaints(user.id);
        setMyComplaints(pComplaints.slice(0, 5));

        const pFees = await db.getFees(user.id);
        setMyFees(pFees);

        const pVisitors = await db.getVisitors(user.id);
        setMyVisitors(pVisitors);

        const todayStr = new Date().toISOString().split('T')[0];
        const attRecords = await db.getAttendance(user.id);
        const hasAttendedToday = attRecords.some(r => r.date === todayStr && (r.status === 'present' || r.status === 'late'));
        setAttendedToday(hasAttendedToday);
      }

      // 3. Load Security Gate Data
      if (user.role === 'security' || user.role === 'admin' || user.role === 'warden') {
        const allVisitors = await db.getVisitors();
        setSecurityVisitors(allVisitors.slice(0, 10));
        
        const todayStr = new Date().toISOString().split('T')[0];
        const allAttendance = await db.getAttendance();
        const checkedInToday = allAttendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;
        setCheckedInCount(checkedInToday);
      }

      // 4. Load Mess Manager Data
      if (user.role === 'mess_manager' || user.role === 'admin') {
        const menuList = await db.getMessMenu();
        setMessMenu(menuList);
        
        const feedbackList = await db.getMessFeedback();
        setMessFeedback(feedbackList);
      }

      // 5. Load General Analytics (Warden & Admin only)
      if (user.role === 'warden' || user.role === 'admin') {
        let totalCapacity = 0;
        let occupiedBeds = 0;

        const blockMap: Record<string, { capacity: number; occupied: number }> = {};
        for (const r of rooms) {
          totalCapacity += r.capacity;
          occupiedBeds += r.occupied;
          const hostelName = r.hostel_name || 'Block';
          if (!blockMap[hostelName]) {
            blockMap[hostelName] = { capacity: 0, occupied: 0 };
          }
          blockMap[hostelName].capacity += r.capacity;
          blockMap[hostelName].occupied += r.occupied;
        }

        const roomChartData = Object.entries(blockMap).map(([hostel, vals]) => ({
          hostel,
          capacity: vals.capacity,
          occupied: vals.occupied,
        }));
        setRoomsChart(roomChartData);

        const complaints = await db.getComplaints();
        const pendingCount = complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length;
        
        const categoryMap: Record<string, number> = {};
        for (const c of complaints) {
          categoryMap[c.status] = (categoryMap[c.status] || 0) + 1;
        }
        const complaintsChartData = Object.entries(categoryMap).map(([status, count]) => ({
          name: status,
          value: count
        }));
        setComplaintsChart(complaintsChartData);

        const visitors = await db.getVisitors();
        const activeVisitors = visitors.filter(v => v.status === 'approved').length;

        const fees = await db.getFees();
        const totalFees = fees.length;
        const paidFees = fees.filter(f => f.payment_status === 'paid').length;
        
        const feeStatusMap: Record<string, number> = { paid: 0, unpaid: 0, overdue: 0 };
        for (const f of fees) {
          feeStatusMap[f.payment_status] = (feeStatusMap[f.payment_status] || 0) + 1;
        }
        const feesChartData = Object.entries(feeStatusMap).map(([status, count]) => ({
          name: status,
          value: count
        }));
        setFeesChart(feesChartData);

        setMetrics({
          occupiedBeds,
          totalCapacity,
          totalStudents: activeAllocations.length,
          pendingComplaints: pendingCount,
          activeVisitors,
          paidFees,
          totalFees
        });

        // Recent Activity logs builder
        const activities = [];
        for (const c of complaints.slice(0, 3)) {
          activities.push({
            id: c.id,
            title: `Complaint Raised (${c.category})`,
            desc: `Raised by ${c.student_name}: "${c.description.substring(0, 40)}..."`,
            type: 'complaint'
          });
        }
        for (const v of visitors.slice(0, 3)) {
          activities.push({
            id: v.id,
            title: `Visitor Logged (${v.visitor_name})`,
            desc: `Host student: ${v.student_name}. Status: ${v.status}`,
            type: 'visitor'
          });
        }
        setRecentActivities(activities.slice(0, 5));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle visitor pass approvals (Student dashboard action)
  const handleVisitorApproval = async (visitorId: string, status: 'approved' | 'rejected') => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, status);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle gate check-in approvals (Security dashboard action)
  const handleCheckIn = async (visitorId: string) => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, 'approved', new Date().toISOString());
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, 'checked_out', undefined, new Date().toISOString());
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading profile workspace...</p>
      </div>
    );
  }

  if (!user) return null;

  // Cards display configuration (Warden / Admin only)
  const adminCards = [
    { title: 'Beds Occupancy', value: `${metrics.occupiedBeds} / ${metrics.totalCapacity}`, desc: 'Total allocated beds', icon: DoorOpen, color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' },
    { title: 'Total Residents', value: metrics.totalStudents, desc: 'Active student residents', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
    { title: 'Pending complaints', value: metrics.pendingComplaints, desc: 'Awaiting resolution', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
    { title: 'Visitors Inside', value: metrics.activeVisitors, desc: 'Currently checked-in', icon: UserCheck, color: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
    { title: 'Fee Collection', value: `${metrics.paidFees} / ${metrics.totalFees}`, desc: 'Invoices paid vs raised', icon: CreditCard, color: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30' },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* ----------------- STUDENT PORTAL DASHBOARD ----------------- */}
      {user.role === 'student' && (
        <div className="space-y-8">
          {/* Welcome header banner */}
          <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md">
            <div className="space-y-2 relative z-10">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Student Resident Portal</span>
              <h2 className="text-2xl font-black mt-2">Welcome back, {user?.name}!</h2>
              <p className="text-xs text-blue-100 max-w-md">
                Manage your hostel room, file maintenance requests, authorize gate visitors, and pay your semester invoices.
              </p>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-full blur-xl absolute right-10 top-10" />
          </div>

          {/* Student Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Room Info */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">My Room Status</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  <Home size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-extrabold leading-none tracking-tight block">
                  {myRoom ? `Room ${myRoom.room_number}` : 'No Room Allocated'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block truncate">
                  {myRoom ? myRoom.hostel_name : 'Contact Warden/Admin'}
                </span>
              </div>
            </div>

            {/* Fee Invoices */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Fee Ledger</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30">
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-extrabold leading-none tracking-tight block">
                  {myFees.length > 0 ? `${myFees.filter(f => f.payment_status === 'unpaid' || f.payment_status === 'overdue').length} Unpaid` : 'No Invoices'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {myFees.some(f => f.payment_status === 'overdue') ? '🚨 OVERDUE WARNING' : 'Fees up to date'}
                </span>
              </div>
            </div>

            {/* QR Attendance */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Gate Attendance</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  attendedToday 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                }`}>
                  <CalendarCheck size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-extrabold leading-none tracking-tight block">
                  {attendedToday ? 'Checked In' : 'Not Checked In'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {attendedToday ? 'Gate logs synced today' : 'Present QR code at gate'}
                </span>
              </div>
            </div>

            {/* Visitor passes */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Gate Visitors</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-extrabold leading-none tracking-tight block">
                  {myVisitors.filter(v => v.status === 'pending').length} Pending
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Awaiting your approval
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: Roommates & Visitor approvals */}
            <div className="lg:col-span-2 space-y-8">
              {/* Roommates Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
                  <Users className="text-blue-500" size={16} />
                  My Room Occupants
                </h3>
                {myRoom ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                      <div className="font-extrabold text-sm">{user.name} (You)</div>
                      <div className="text-slate-400 text-xs mt-0.5 truncate">{user.email}</div>
                      <span className="inline-block mt-3 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold rounded-full">Primary Resident</span>
                    </div>
                    {myRoommates.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center">
                        No roommates allocated to your room yet.
                      </div>
                    ) : (
                      myRoommates.map(rm => (
                        <div key={rm.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between">
                          <div>
                            <div className="font-bold text-sm">{rm.name}</div>
                            <div className="text-slate-400 text-xs mt-0.5 truncate">{rm.email}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-3 font-semibold truncate">📞 {rm.phone || 'No phone'}</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">You are not currently assigned to any room block.</p>
                )}
              </div>

              {/* Visitor Approvals */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-purple-500" size={16} />
                  Pending Visitor Gate Passes
                </h3>
                {myVisitors.filter(v => v.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No visitor entry requests awaiting your authorization.</p>
                ) : (
                  <div className="space-y-3.5">
                    {myVisitors.filter(v => v.status === 'pending').map(v => (
                      <div key={v.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-slate-800 dark:text-zinc-200">{v.visitor_name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Purpose: {v.purpose || 'Not stated'}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Phone: {v.phone}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVisitorApproval(v.id, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center"
                            title="Approve Entry"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleVisitorApproval(v.id, 'rejected')}
                            className="p-2 bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                            title="Reject Entry"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Complaints list & Fast Action links */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={16} />
                  My Complaints Status
                </h3>
                {myComplaints.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">You have no complaints filed.</p>
                ) : (
                  <div className="space-y-3">
                    {myComplaints.map(c => (
                      <div key={c.id} className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-zinc-200">{c.category}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{c.description}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                          c.status === 'resolved' || c.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                            : c.status === 'in_progress'
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Ecosystem Shortcuts</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link href="/dashboard/complaints" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 rounded-xl hover:bg-slate-100 transition-all text-xs font-bold">
                    <span>File Maintenance Ticket</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                  <Link href="/dashboard/attendance" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 rounded-xl hover:bg-slate-100 transition-all text-xs font-bold">
                    <span>Generate Check-in QR</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                  <Link href="/dashboard/fees" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 rounded-xl hover:bg-slate-100 transition-all text-xs font-bold">
                    <span>Pay Pending Bills</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SECURITY GATES DASHBOARD ----------------- */}
      {user.role === 'security' && (
        <div className="space-y-8">
          <div className="p-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md">
            <div className="space-y-2 relative z-10">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Gate Guard Dashboard</span>
              <h2 className="text-2xl font-black mt-2">Gate Control Terminal - {user?.name}</h2>
              <p className="text-xs text-purple-100 max-w-md">
                Register campus gate visitors, check-in approved guests, and monitor student daily check-in logs.
              </p>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-full blur-xl absolute right-10 top-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Visitors Inside</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {securityVisitors.filter(v => v.status === 'approved' && v.entry_time && !v.exit_time).length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Guests currently on campus</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Unresolved Passes</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {securityVisitors.filter(v => v.status === 'pending').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Awaiting student approvals</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Checked In Today</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  <CalendarCheck size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {checkedInCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Student check-in scans today</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold tracking-tight">Active Gate Visitors Control</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gate Actions</span>
              </div>
              
              {securityVisitors.filter(v => v.status !== 'rejected').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No visitor logs registered.</p>
              ) : (
                <div className="space-y-3">
                  {securityVisitors.filter(v => v.status !== 'rejected').slice(0, 5).map(v => {
                    const isInside = v.status === 'approved' && v.entry_time && !v.exit_time;
                    const isPending = v.status === 'pending';
                    const isCheckedOut = v.status === 'checked_out' || (v.entry_time && v.exit_time);

                    return (
                      <div key={v.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-zinc-200">{v.visitor_name}</div>
                          <div className="text-[10px] text-slate-400">Host: {v.student_name} | Tel: {v.phone}</div>
                          {isInside && <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Entered: {new Date(v.entry_time!).toLocaleTimeString()}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-100 dark:border-amber-900/30">Awaiting Approval</span>
                          )}
                          {isInside && (
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            >
                              Check Out
                            </button>
                          )}
                          {isCheckedOut && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-bold rounded-lg">Checked Out</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Gate Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Link href="/dashboard/visitors" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 transition-all">
                    <div>
                      <div className="text-xs font-extrabold">Register New Visitor</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Authorize a new guest pass</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                  <Link href="/dashboard/attendance" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 transition-all">
                    <div>
                      <div className="text-xs font-extrabold">QR Scanner Terminal</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Scan student codes for check-in</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MESS MANAGER DASHBOARD ----------------- */}
      {user.role === 'mess_manager' && (
        <div className="space-y-8">
          <div className="p-8 bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md">
            <div className="space-y-2 relative z-10">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Mess Manager Dashboard</span>
              <h2 className="text-2xl font-black mt-2">Kitchen & Cafeteria Panel - {user?.name}</h2>
              <p className="text-xs text-emerald-100 max-w-md">
                Plan weekly student meal menus, inspect food reviews and ratings, and coordinate mess feedback logs.
              </p>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-full blur-xl absolute right-10 top-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Breakfast Rating</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
                  <Utensils size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {messFeedback.filter(f => f.meal_type === 'breakfast').length > 0
                    ? (messFeedback.filter(f => f.meal_type === 'breakfast').reduce((acc, curr) => acc + curr.rating, 0) / messFeedback.filter(f => f.meal_type === 'breakfast').length).toFixed(1)
                    : 'N/A'} ⭐
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Lunch Rating</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  <Utensils size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {messFeedback.filter(f => f.meal_type === 'lunch').length > 0
                    ? (messFeedback.filter(f => f.meal_type === 'lunch').reduce((acc, curr) => acc + curr.rating, 0) / messFeedback.filter(f => f.meal_type === 'lunch').length).toFixed(1)
                    : 'N/A'} ⭐
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Dinner Rating</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  <Utensils size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold leading-none tracking-tight block">
                  {messFeedback.filter(f => f.meal_type === 'dinner').length > 0
                    ? (messFeedback.filter(f => f.meal_type === 'dinner').reduce((acc, curr) => acc + curr.rating, 0) / messFeedback.filter(f => f.meal_type === 'dinner').length).toFixed(1)
                    : 'N/A'} ⭐
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold tracking-tight mb-2 flex items-center gap-2">
                <Utensils size={16} className="text-emerald-500" />
                Today's Menu Plan
              </h3>
              {messMenu.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No menu registered.</p>
              ) : (
                (() => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const todayName = days[new Date().getDay()];
                  const todayMenu = messMenu.find(m => m.day_of_week === todayName) || messMenu[0];
                  
                  return (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 capitalize">{todayMenu.day_of_week} Menu Plan</div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="text-[10px] font-black uppercase text-slate-400">Breakfast</div>
                        <div className="text-xs font-extrabold mt-0.5">{todayMenu.breakfast}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="text-[10px] font-black uppercase text-slate-400">Lunch</div>
                        <div className="text-xs font-extrabold mt-0.5">{todayMenu.lunch}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="text-[10px] font-black uppercase text-slate-400">Dinner</div>
                        <div className="text-xs font-extrabold mt-0.5">{todayMenu.dinner}</div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
                <Utensils size={16} className="text-yellow-500" />
                Latest Student Food Reviews
              </h3>
              {messFeedback.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No feedback records registered yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {messFeedback.slice(0, 5).map(f => (
                    <div key={f.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="font-extrabold capitalize text-slate-800 dark:text-zinc-200">{f.meal_type} rating</div>
                        <p className="text-slate-500 dark:text-zinc-400 mt-1 italic font-medium">"{f.comment || 'No comment provided'}"</p>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-2">By: {f.student_name || 'Anonymous'}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 text-xs font-black rounded-lg whitespace-nowrap">
                        {f.rating} ⭐
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- WARDEN & ADMIN PORTAL ----------------- */}
      {(user.role === 'warden' || user.role === 'admin') && (
        <div className="space-y-8">
          {/* Welcome header banner */}
          <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md flex items-center justify-between">
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl font-black">Welcome back, {user?.name}!</h2>
              <p className="text-xs text-blue-100 max-w-md">
                This dashboard displays critical operations status. Use the quick switcher at the top right to switch roles and inspect different portals.
              </p>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-full blur-xl absolute right-10 top-10" />
          </div>

          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {adminCards.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">{c.title}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xl font-extrabold leading-none tracking-tight block">{c.value}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{c.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <DashboardCharts 
            roomsData={roomsChart}
            complaintsData={complaintsChart}
            feesData={feesChart}
          />

          {/* Recent Activity Logs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold tracking-tight">Recent Operations Log</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live feed</span>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No recent logs registered.</p>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between text-xs py-1 border-b border-slate-50 last:border-b-0 dark:border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">{act.title}</div>
                      <div className="text-slate-400 text-[11px]">{act.desc}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                      act.type === 'complaint' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/20'
                    }`}>
                      {act.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
