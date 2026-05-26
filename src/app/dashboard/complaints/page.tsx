'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Complaint, Profile } from '../../../types';
import { 
  Plus, AlertCircle, Clock, CheckCircle2, ChevronRight, 
  HelpCircle, UserCheck, ShieldAlert 
} from 'lucide-react';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);

  // Raise Complaint Form state (Student)
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [ticketRaisedSuccess, setTicketRaisedSuccess] = useState(false);

  // Warden assignment state
  const [assigningToMap, setAssigningToMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      // Fetch complaints
      let list: Complaint[] = [];
      if (user.role === 'student') {
        list = await db.getComplaints(user.id);
      } else {
        list = await db.getComplaints();
      }
      setComplaints(list);

      // Fetch staff (wardens + admins) for ticket assignment option
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
      const staffList = allProfiles.filter(p => p.role === 'warden' || p.role === 'admin');
      setStaff(staffList);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle raise ticket (Student)
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    try {
      const db = getDbService();
      await db.addComplaint(user!.id, category, description);
      setTicketRaisedSuccess(true);
      setDescription('');
      setTimeout(() => setTicketRaisedSuccess(false), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit complaint ticket.');
    }
  };

  // Handle assignment select (Warden)
  const handleAssignSelect = (ticketId: string, staffId: string) => {
    setAssigningToMap(prev => ({
      ...prev,
      [ticketId]: staffId
    }));
  };

  // Save assignment and set in progress (Warden)
  const saveAssignment = async (ticketId: string) => {
    const staffId = assigningToMap[ticketId];
    if (!staffId) return;

    try {
      const db = getDbService();
      await db.updateComplaintStatus(ticketId, 'in_progress', staffId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Set Resolved (Warden)
  const setTicketResolved = async (ticketId: string) => {
    try {
      const db = getDbService();
      await db.updateComplaintStatus(ticketId, 'resolved', undefined, new Date().toISOString());
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Get status tags colors
  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'pending': 
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Internet / Wi-Fi', 'Room Cleanings', 'Others'];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading complaint boards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ---------------- STUDENT COMPLAINTS FORM ---------------- */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Submit form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus size={16} className="text-blue-500" />
              File Maintenance Ticket
            </h3>
            
            {ticketRaisedSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                Complaint ticket raised. Wardens notified.
              </div>
            )}

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description / Location details</label>
                <textarea
                  required
                  placeholder="Describe your maintenance request clearly. e.g. 'Room 101 ceiling light is flickering.'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!description}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Raise Complaint Ticket
              </button>
            </form>
          </div>

          {/* Student ticket list */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">My Complaint History</h3>
            
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">You have not registered any complaints yet.</p>
              ) : (
                complaints.map(comp => (
                  <div key={comp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl dark:bg-zinc-850 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between gap-3">
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">{comp.category}</span>
                        <span className="text-[9px] text-slate-400 font-mono">#{comp.id.substring(0, 8)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{comp.description}</p>
                      
                      {comp.assigned_to_name && (
                        <span className="text-[10px] text-slate-400 block pt-1.5">
                          Assigned Warden: <span className="font-bold text-slate-500 dark:text-zinc-300">{comp.assigned_to_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex sm:flex-col justify-between items-end gap-2 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${getStatusBadge(comp.status)}`}>
                        {comp.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-slate-300">
                        {new Date(comp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ---------------- WARDEN/ADMIN COMPLAINTS DASHBOARD ---------------- */}
      {(user?.role === 'admin' || user?.role === 'warden') && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold tracking-tight">Active Hostel Complaints Registry</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Ticket ID</th>
                  <th className="py-3 px-2">Resident Details</th>
                  <th className="py-3 px-2">Category & Issue</th>
                  <th className="py-3 px-2">Assignment</th>
                  <th className="py-3 px-2">Status Flag</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No complaints registered in the system.</td>
                  </tr>
                ) : (
                  complaints.map(comp => (
                    <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3.5 px-2 font-mono text-slate-400 select-all">
                        #{comp.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-2">
                        <Link 
                          href={`/dashboard/profiles/${comp.student_id}`}
                          className="font-bold text-blue-650 hover:text-blue-700 hover:underline transition-colors"
                        >
                          {comp.student_name}
                        </Link>
                        <div className="text-[10px] text-slate-400 mt-0.5">Resident Student</div>
                      </td>
                      <td className="py-3.5 px-2 max-w-xs">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">{comp.category}</div>
                        <p className="text-[11px] text-slate-400 mt-1 truncate" title={comp.description}>
                          {comp.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-2">
                        {comp.status === 'pending' ? (
                          <div className="flex gap-1.5 items-center">
                            <select
                              value={assigningToMap[comp.id] || ''}
                              onChange={(e) => handleAssignSelect(comp.id, e.target.value)}
                              className="p-1 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded text-[10px] font-semibold"
                            >
                              <option value="">-- Assign staff --</option>
                              {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                              ))}
                            </select>
                            <button
                              disabled={!assigningToMap[comp.id]}
                              onClick={() => saveAssignment(comp.id)}
                              className="p-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-500 dark:text-zinc-300">
                            {comp.assigned_to_name || 'Assigned Staff'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${getStatusBadge(comp.status)}`}>
                          {comp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {comp.status !== 'resolved' && comp.status !== 'closed' ? (
                          <button
                            onClick={() => setTicketResolved(comp.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 rounded font-bold text-[10px] transition-colors"
                          >
                            Resolve Ticket
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Resolved
                          </span>
                        )}
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
