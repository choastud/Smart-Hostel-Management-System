'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Visitor, Profile } from '../../../types';
import { 
  Users, UserPlus, LogIn, LogOut, Check, X, 
  Clock, Search, UserCheck, ShieldAlert, Phone 
} from 'lucide-react';

export default function VisitorsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  
  // Security Form state
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [hostStudentId, setHostStudentId] = useState('');
  const [visPurpose, setVisPurpose] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      let vList: Visitor[] = [];
      if (user.role === 'student') {
        vList = await db.getVisitors(user.id);
      } else {
        vList = await db.getVisitors();
      }
      setVisitors(vList);

      // Load student profiles (for Security selector)
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
      const studList = allProfiles.filter(p => p.role === 'student');
      setStudents(studList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Register Visitor (Security)
  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visName || !visPhone || !hostStudentId) return;

    try {
      const db = getDbService();
      await db.addVisitor(visName, visPhone, hostStudentId, visPurpose);
      setVisName('');
      setVisPhone('');
      setVisPurpose('');
      setRegisterSuccess(true);
      setTimeout(() => setRegisterSuccess(false), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register visitor.');
    }
  };

  // Handle Approve/Reject Visitor (Student)
  const handleApproval = async (visitorId: string, status: 'approved' | 'rejected') => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, status);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Gate Check-In Entry (Security)
  const handleCheckIn = async (visitorId: string) => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, 'approved', new Date().toISOString());
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Gate Check-Out Exit (Security)
  const handleCheckOut = async (visitorId: string) => {
    try {
      const db = getDbService();
      await db.updateVisitorStatus(visitorId, 'checked_out', undefined, new Date().toISOString());
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Visitor status badges
  const getStatusBadge = (status: Visitor['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      case 'checked_out':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading visitor logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* ---------------- STUDENT PORTAL (APPROVAL PANEL) ---------------- */}
      {user?.role === 'student' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            Visitor Access Approvals
          </h3>
          <p className="text-xs text-slate-400">
            Below is the list of visitors requesting access at the gate to meet you. Approve to allow entry.
          </p>

          <div className="space-y-4">
            {visitors.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No visitor logs found.</p>
            ) : (
              visitors.map(vis => (
                <div key={vis.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl dark:bg-zinc-850 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm">{vis.visitor_name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone size={12} /> {vis.phone}
                    </div>
                    {vis.purpose && (
                      <p className="text-[11px] text-slate-400 mt-1">Purpose: "{vis.purpose}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${getStatusBadge(vis.status)}`}>
                      {vis.status.replace('_', ' ')}
                    </span>
                    
                    {vis.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproval(vis.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleApproval(vis.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- GATE SECURITY PORTAL ---------------- */}
      {user?.role === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Visitor Check-in Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <UserPlus size={16} className="text-blue-500" />
              Register Gate Visitor
            </h3>
            
            {registerSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                Visitor registered. Student host notified for approval.
              </div>
            )}

            <form onSubmit={handleRegisterVisitor} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Visitor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={visName}
                  onChange={(e) => setVisName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Visitor Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9888888888"
                  value={visPhone}
                  onChange={(e) => setVisPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Student Host / Roommate</label>
                <select
                  value={hostStudentId}
                  onChange={(e) => setHostStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Choose student host --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email.split('@')[0]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Visit Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Parents visit / Laundry deliver"
                  value={visPurpose}
                  onChange={(e) => setVisPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!visName || !visPhone || !hostStudentId}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Request Student Verification
              </button>
            </form>
          </div>

          {/* Today's logs table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">Today's Gate Visitor registry</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-2">Visitor Details</th>
                    <th className="py-3 px-2">Host Details</th>
                    <th className="py-3 px-2">Verification Status</th>
                    <th className="py-3 px-2 text-right">Gate Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {visitors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">No visitors logged today.</td>
                    </tr>
                  ) : (
                    visitors.map(vis => (
                      <tr key={vis.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                        <td className="py-3.5 px-2">
                          <div className="font-bold">{vis.visitor_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{vis.phone}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <Link 
                            href={`/dashboard/profiles/${vis.student_id}`}
                            className="font-semibold text-blue-650 hover:text-blue-700 hover:underline transition-colors"
                          >
                            {vis.student_name}
                          </Link>
                          <div className="text-[10px] text-slate-400 mt-0.5">Room {vis.room_number || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${getStatusBadge(vis.status)}`}>
                            {vis.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          {vis.status === 'approved' && !vis.entry_time && (
                            <button
                              onClick={() => handleCheckIn(vis.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] inline-flex items-center gap-1 transition-colors"
                            >
                              <LogIn size={10} /> Check-In
                            </button>
                          )}
                          {vis.status === 'approved' && vis.entry_time && (
                            <button
                              onClick={() => handleCheckOut(vis.id)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] inline-flex items-center gap-1 transition-colors"
                            >
                              <LogOut size={10} /> Check-Out
                            </button>
                          )}
                          {vis.status === 'checked_out' && (
                            <span className="text-[10px] text-slate-400 font-semibold block">Checked out</span>
                          )}
                          {vis.status === 'pending' && (
                            <span className="text-[10px] text-slate-400 animate-pulse font-bold block text-amber-500">Awaiting student...</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ---------------- ADMIN/WARDEN ARCHIVE PORTAL ---------------- */}
      {(user?.role === 'admin' || user?.role === 'warden') && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold tracking-tight">System Visitor Access History Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Visitor Details</th>
                  <th className="py-3 px-2">Student Host</th>
                  <th className="py-3 px-2">Purpose</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Check-in time</th>
                  <th className="py-3 px-2">Check-out time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No visitors logged in database.</td>
                  </tr>
                ) : (
                  visitors.map(vis => (
                    <tr key={vis.id}>
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-slate-800 dark:text-zinc-200">{vis.visitor_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{vis.phone}</div>
                      </td>
                      <td className="py-3.5 px-2 font-semibold">
                        <Link 
                          href={`/dashboard/profiles/${vis.student_id}`}
                          className="text-blue-650 hover:text-blue-700 hover:underline transition-colors"
                        >
                          {vis.student_name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400">
                        {vis.purpose || 'N/A'}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold capitalize border ${getStatusBadge(vis.status)}`}>
                          {vis.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400">
                        {vis.entry_time ? new Date(vis.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-2 text-slate-400">
                        {vis.exit_time ? new Date(vis.exit_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
