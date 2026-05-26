'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Visitor } from '../../../types';
import { 
  UserCheck, Clock, CalendarCheck, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function SecurityDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [securityVisitors, setSecurityVisitors] = useState<Visitor[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const allVisitors = await db.getVisitors();
      setSecurityVisitors(allVisitors.slice(0, 10));
      
      const todayStr = new Date().toISOString().split('T')[0];
      const allAttendance = await db.getAttendance();
      const checkedInToday = allAttendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;
      setCheckedInCount(checkedInToday);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

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
        <p className="text-xs font-bold text-slate-400">Loading security gate terminal...</p>
      </div>
    );
  }

  if (!user || user.role !== 'security') {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. Gate Security role credentials required.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
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
                      <div className="text-[10px] text-slate-400">
                        Host Student: <Link href={`/dashboard/profiles/${v.student_id}`} className="text-blue-600 hover:underline">{v.student_name || 'Unknown'}</Link> | Tel: {v.phone}
                      </div>
                      {isInside && <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Entered: {new Date(v.entry_time!).toLocaleTimeString()}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-100 dark:border-amber-900/30">Awaiting Approval</span>
                      )}
                      {isInside && (
                        <button
                          onClick={() => handleCheckOut(v.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-100 transition-colors cursor-pointer"
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
  );
}
