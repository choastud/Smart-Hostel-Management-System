'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Room, Profile, Complaint, Visitor, Fee } from '../../../types';
import DashboardCharts from '../../../components/DashboardCharts';
import { 
  DoorOpen, Users, AlertTriangle, UserCheck, CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function WardenDashboardPage() {
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

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const rooms = await db.getRooms();
      const allocations = await db.getAllocations();
      const activeAllocations = allocations.filter(a => a.status === 'active');

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

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading admin/warden overview...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'warden' && user.role !== 'admin')) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. Warden or Admin credentials required.
      </div>
    );
  }

  const adminCards = [
    { title: 'Beds Occupancy', value: `${metrics.occupiedBeds} / ${metrics.totalCapacity}`, desc: 'Total allocated beds', icon: DoorOpen, color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' },
    { title: 'Total Residents', value: metrics.totalStudents, desc: 'Active student residents', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
    { title: 'Pending complaints', value: metrics.pendingComplaints, desc: 'Awaiting resolution', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
    { title: 'Visitors Inside', value: metrics.activeVisitors, desc: 'Currently checked-in', icon: UserCheck, color: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
    { title: 'Fee Collection', value: `${metrics.paidFees} / ${metrics.totalFees}`, desc: 'Invoices paid vs raised', icon: CreditCard, color: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome header banner */}
      <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md flex items-center justify-between">
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-black">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-blue-100 max-w-md">
            This dashboard displays critical operations status. Navigate tabs to manage residents, allocations, dining fees, and scanner terminals.
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
  );
}
