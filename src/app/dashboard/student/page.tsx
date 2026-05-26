'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Room, Profile, Complaint, Visitor, Fee } from '../../../types';
import { 
  Users, AlertTriangle, CreditCard, Home, CalendarCheck, Check, ShieldCheck, ChevronRight, XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [myRoommates, setMyRoommates] = useState<Profile[]>([]);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [myFees, setMyFees] = useState<Fee[]>([]);
  const [myVisitors, setMyVisitors] = useState<Visitor[]>([]);
  const [attendedToday, setAttendedToday] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const rooms = await db.getRooms();
      const allocations = await db.getAllocations();
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
          roommatesList = allProfiles.filter(p => roommateIds.includes(p.id) && p.role === 'student');
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

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleVisitorApproval = async (visitorId: string, status: 'approved' | 'rejected') => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, status);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading student workspace...</p>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. Student profile role required.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
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
                  <Link href={`/dashboard/profiles/${user.id}`} className="font-extrabold text-sm text-blue-600 hover:underline">{user.name} (You)</Link>
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
                        <Link href={`/dashboard/profiles/${rm.id}`} className="font-bold text-sm hover:underline text-slate-800 dark:text-slate-200">{rm.name}</Link>
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
                  <div key={v.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">{v.visitor_name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Purpose: {v.purpose || 'Not stated'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Phone: {v.phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVisitorApproval(v.id, 'approved')}
                        className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center cursor-pointer"
                        title="Approve Entry"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleVisitorApproval(v.id, 'rejected')}
                        className="p-2 bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer"
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
  );
}
