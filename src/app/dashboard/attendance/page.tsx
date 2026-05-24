'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Attendance, Profile } from '../../../types';
import QRCode from 'react-qr-code';
import { 
  QrCode, UserCheck, ShieldCheck, Clock, Check, 
  AlertCircle, Camera, Search 
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  // QR Generation state (Admin/Security)
  const [qrValue, setQrValue] = useState('');
  
  // QR Scan Simulation state (Student)
  const [qrInput, setQrInput] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      // Set today's QR code seed value
      const todayStr = new Date().toISOString().split('T')[0];
      setQrValue(`AURA_ATTENDANCE_PASS_${todayStr}`);

      let list: Attendance[] = [];
      if (user.role === 'student') {
        list = await db.getAttendance(user.id);
      } else {
        list = await db.getAttendance(undefined, searchDate);
      }
      setAttendanceLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, searchDate]);

  // Handle Scanning Simulation (Student inputs QR text)
  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScanSuccess(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const expectedValue = `AURA_ATTENDANCE_PASS_${todayStr}`;

    if (qrInput !== expectedValue) {
      setScanError('Invalid QR Code. Make sure the code is active for today.');
      return;
    }

    try {
      const db = getDbService();
      // Check if late (after 9:00 PM for hostel curfew check)
      const now = new Date();
      const isLate = now.getHours() >= 21; // 9 PM onwards is late entry
      const status = isLate ? 'late' : 'present';

      await db.recordAttendance(user!.id, status, now.toISOString());
      setScanSuccess(true);
      setQrInput('');
      await loadData();
    } catch (err: any) {
      setScanError(err.message || 'Failed to register check-in.');
    }
  };

  // Quick scan button for easy testing
  const triggerQuickTestScan = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setQrInput(`AURA_ATTENDANCE_PASS_${todayStr}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ---------------- STUDENT ATTTENDANCE SCAN ---------------- */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Scan Simulation input */}
          <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <QrCode className="text-blue-500" size={20} />
                Student Gate Pass Check-in
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the QR Code presented at the security gate to record your entry timestamp. 
                (Entries after 9:00 PM are flagged as <b>Late Entry</b>).
              </p>

              {scanSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Check-in registered successfully!
                </div>
              )}

              {scanError && (
                <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  {scanError}
                </div>
              )}

              <form onSubmit={handleSimulateScan} className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QR Code Content Input</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste/Type scanned QR token..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    className="flex-1 p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck size={14} /> Submit
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={triggerQuickTestScan}
                  className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-blue-600 dark:bg-zinc-850 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-800/80 transition-colors"
                >
                  ⚡ Simulate Camera QR Scan Detection (Autofill Code)
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 mt-6 text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
              <Clock size={12} />
              Hostel gate curfew: 9:00 PM daily.
            </div>
          </div>

          {/* Student Logs */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">My Check-in Log History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Entry Time</th>
                    <th className="py-3 px-2">Check-in Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">No logs registered.</td>
                    </tr>
                  ) : (
                    attendanceLogs.map(log => (
                      <tr key={log.id}>
                        <td className="py-3.5 px-2 font-semibold">{log.date}</td>
                        <td className="py-3.5 px-2 text-slate-400">
                          {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                            log.status === 'present' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          }`}>
                            {log.status}
                          </span>
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

      {/* ---------------- ADMIN/WARDEN/SECURITY PANEL ---------------- */}
      {user?.role !== 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* QR Generator Frame */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-between gap-6 text-center">
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center justify-center gap-1.5">
                <QrCode size={16} className="text-blue-500" />
                Active Attendance Gate QR
              </h3>
              <p className="text-[11px] text-slate-400">
                Display this code at the gate counter. Students scan via mobile web camera to register check-in.
              </p>
            </div>

            {/* QR Rendering block */}
            <div className="p-4 bg-white border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm inline-block">
              {qrValue ? (
                <QRCode value={qrValue} size={160} />
              ) : (
                <div className="w-40 h-40 bg-slate-100 rounded-xl animate-pulse" />
              )}
            </div>

            <div className="bg-slate-50 dark:bg-zinc-850 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 w-full text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Today's Token Code</span>
              <span className="text-xs font-mono font-extrabold mt-1 block select-all text-blue-600 dark:text-blue-400">{qrValue}</span>
            </div>
          </div>

          {/* Global Logs list */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold tracking-tight">Daily Occupant Attendance Register</h3>
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-2">Resident</th>
                      <th className="py-3 px-2">Roll Number</th>
                      <th className="py-3 px-2">Check-in Time</th>
                      <th className="py-3 px-2">Curfew Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">No student checks registered for this date.</td>
                      </tr>
                    ) : (
                      attendanceLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                          <td className="py-3.5 px-2 font-bold">{log.student_name}</td>
                          <td className="py-3.5 px-2 font-mono text-slate-500">{log.student_roll}</td>
                          <td className="py-3.5 px-2 text-slate-400">
                            {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                              log.status === 'present' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                            }`}>
                              {log.status === 'present' ? 'On Time' : 'Late Entry'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-right mt-4">
              Showing total of {attendanceLogs.length} occupant checks.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
