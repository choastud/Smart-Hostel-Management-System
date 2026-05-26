'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '../../../../services/AuthContext';
import { getDbService } from '../../../../services/db';
import { Profile, Room, Attendance, Complaint, Visitor, Fee } from '../../../../types';
import { 
  ArrowLeft, User, Mail, Phone, Home, CalendarCheck, AlertTriangle, Users, CreditCard, Sparkles, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileDetailPage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [studentRoom, setStudentRoom] = useState<Room | null>(null);
  const [studentRoommates, setStudentRoommates] = useState<Profile[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const loadProfileData = async () => {
    if (!profileId) return;
    try {
      setLoading(true);
      const db = getDbService();

      // Fetch profiles
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
      
      const foundProfile = allProfiles.find(p => p.id === profileId) || null;
      setTargetProfile(foundProfile);

      if (foundProfile && foundProfile.role === 'student') {
        // Fetch Room & Roommates
        const rooms = await db.getRooms();
        const allocations = await db.getAllocations();
        const myAlloc = allocations.find(a => a.student_id === foundProfile.id && a.status === 'active');
        
        let rObj: Room | null = null;
        let roommatesList: Profile[] = [];
        
        if (myAlloc) {
          rObj = rooms.find(rm => rm.id === myAlloc.room_id) || null;
          if (rObj) {
            const roommateIds = allocations
              .filter(a => a.room_id === rObj!.id && a.student_id !== foundProfile.id && a.status === 'active')
              .map(a => a.student_id);
            roommatesList = allProfiles.filter(p => roommateIds.includes(p.id) && p.role === 'student');
          }
        }
        setStudentRoom(rObj);
        setStudentRoommates(roommatesList);

        // Fetch logs
        const attList = await db.getAttendance(foundProfile.id);
        setAttendanceLogs(attList);

        const compList = await db.getComplaints(foundProfile.id);
        setComplaints(compList);

        const visList = await db.getVisitors(foundProfile.id);
        setVisitors(visList);

        const feeList = await db.getFees(foundProfile.id);
        setFees(feeList);
      }

    } catch (e) {
      console.error('Failed to load profile details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Inspecting profile data...</p>
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-red-500">Profile Not Found</h3>
        <p className="text-xs text-slate-400">The profile ID `{profileId}` does not match any registered users.</p>
        <Link href="/dashboard/profiles" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
          <ArrowLeft size={14} /> Back to Directory
        </Link>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    student: 'Resident Student',
    admin: 'System Admin',
    warden: 'Block Warden',
    security: 'Gate Security',
    mess_manager: 'Mess Manager',
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Back navigation */}
      <div>
        <Link 
          href="/dashboard/profiles" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} /> Back to profiles directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Main Profile Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/30">
                <User size={36} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-zinc-150">{targetProfile.name}</h3>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 block uppercase tracking-wider">
                  {roleLabels[targetProfile.role] || targetProfile.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl flex items-center gap-3">
                <Mail size={15} className="text-slate-400" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block leading-none">Email Address</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-mono mt-0.5 block">{targetProfile.email}</span>
                </div>
              </div>

              {targetProfile.phone && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl flex items-center gap-3">
                  <Phone size={15} className="text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block leading-none">Phone Contact</span>
                    <span className="text-slate-700 dark:text-zinc-300 mt-0.5 block">{targetProfile.phone}</span>
                  </div>
                </div>
              )}

              {targetProfile.gender && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl flex items-center gap-3">
                  <User size={15} className="text-slate-400" />
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block leading-none">Gender Segment</span>
                    <span className="text-slate-700 dark:text-zinc-300 capitalize mt-0.5 block">{targetProfile.gender}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Record ID: {targetProfile.id}</span>
          </div>
        </div>

        {/* Right Side: Specific Details for Students */}
        <div className="lg:col-span-8 space-y-8">
          {targetProfile.role === 'student' ? (
            <>
              {/* Room details and roommates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Home size={14} className="text-blue-500" /> Allocated Room status
                  </h4>
                  {studentRoom ? (
                    <div className="space-y-1">
                      <div className="text-lg font-extrabold text-slate-800 dark:text-zinc-150">Room {studentRoom.room_number}</div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{studentRoom.hostel_name}</div>
                      <div className="text-[10px] text-slate-400 mt-2 font-medium">Floor {studentRoom.floor} | Bed slots occupied: {studentRoom.occupied}/{studentRoom.capacity}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active room block allocated to this resident.</p>
                  )}
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-blue-500" /> Roommates
                  </h4>
                  {studentRoommates.length === 0 ? (
                    <p className="text-xs text-slate-400">No other roommates registered in this slot.</p>
                  ) : (
                    <div className="space-y-2">
                      {studentRoommates.map(rm => (
                        <div key={rm.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0 border-slate-50 dark:border-zinc-800/40">
                          <div>
                            <Link href={`/dashboard/profiles/${rm.id}`} className="font-extrabold text-blue-600 hover:underline">{rm.name}</Link>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{rm.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance and Fees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <CalendarCheck size={14} className="text-emerald-500" /> Check-in logs
                  </h4>
                  {attendanceLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">No attendance timestamps logged.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {attendanceLogs.map(log => (
                        <div key={log.id} className="flex justify-between text-xs py-1.5 border-b last:border-0 border-slate-50 dark:border-zinc-800/40 font-semibold">
                          <span className="text-slate-500 dark:text-zinc-400">{log.date}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              log.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fees */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-pink-500" /> Fee Invoices
                  </h4>
                  {fees.length === 0 ? (
                    <p className="text-xs text-slate-400">No fee records found for this student.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {fees.map(fee => (
                        <div key={fee.id} className="flex justify-between items-center text-xs py-1.5 border-b last:border-0 border-slate-50 dark:border-zinc-800/40 font-semibold">
                          <div>
                            <div className="text-slate-800 dark:text-zinc-200">Rs. {fee.amount}</div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Due: {fee.due_date}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            fee.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : fee.payment_status === 'overdue'
                              ? 'bg-red-50 text-red-600 dark:bg-red-950/20 animate-pulse'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                          }`}>
                            {fee.payment_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Complaints and Visitors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Complaints */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-orange-500" /> Maintenance Tickets
                  </h4>
                  {complaints.length === 0 ? (
                    <p className="text-xs text-slate-400">No maintenance tickets submitted.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {complaints.map(comp => (
                        <div key={comp.id} className="flex justify-between items-center text-xs py-2 border-b last:border-0 border-slate-50 dark:border-zinc-800/40 font-semibold">
                          <div className="max-w-[180px]">
                            <div className="text-slate-800 dark:text-zinc-200 truncate">{comp.category}</div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{comp.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            comp.status === 'resolved' || comp.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : comp.status === 'in_progress'
                              ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                          }`}>
                            {comp.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visitors */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-purple-500" /> Visitor log
                  </h4>
                  {visitors.length === 0 ? (
                    <p className="text-xs text-slate-400">No visitors registered for this resident.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {visitors.map(vis => (
                        <div key={vis.id} className="flex justify-between items-center text-xs py-2 border-b last:border-0 border-slate-50 dark:border-zinc-800/40 font-semibold">
                          <div>
                            <div className="text-slate-800 dark:text-zinc-200">{vis.visitor_name}</div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Purpose: {vis.purpose || 'Not stated'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            vis.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : vis.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                              : vis.status === 'checked_out'
                              ? 'bg-slate-100 text-slate-655 dark:bg-zinc-800'
                              : 'bg-red-50 text-red-655 dark:bg-red-950/20'
                          }`}>
                            {vis.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm text-center py-16 space-y-3">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto" />
              <h4 className="font-extrabold text-base text-slate-800 dark:text-zinc-200">Staff Account Profile</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">This account belongs to a member of the hostel administration. Operational detail trackers are only available for resident student profiles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
