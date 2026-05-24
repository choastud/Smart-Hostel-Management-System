'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface ChartProps {
  roomsData: { hostel: string; capacity: number; occupied: number }[];
  complaintsData: { name: string; value: number }[];
  feesData: { name: string; value: number }[];
}

export default function DashboardCharts({ roomsData, complaintsData, feesData }: ChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-80 animate-pulse bg-slate-50 dark:bg-zinc-800/40 rounded-xl" />
    );
  }

  // Color Palette
  const COMPLAINT_COLORS = ['#3B82F6', '#FB923C', '#F87171', '#4ADE80']; // blue, orange, red, green
  const FEE_COLORS = ['#4ADE80', '#F87171', '#FBBF24']; // green, red, amber

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Room Occupancy Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold mb-4 tracking-tight">Room Occupancy by Block</h3>
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={roomsData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="hostel" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  borderColor: '#E2E8F0', 
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="occupied" name="Occupied Beds" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Total Capacity" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complaint Tickets Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold mb-4 tracking-tight">Active Complaints Breakdown</h3>
        <div className="h-64 flex-1 flex flex-col md:flex-row items-center justify-center">
          <div className="w-full md:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {complaintsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    fontSize: '11px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2.5 px-4">
            {complaintsData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMPLAINT_COLORS[i % COMPLAINT_COLORS.length] }} />
                  <span className="text-slate-500 dark:text-zinc-400 capitalize">{c.name.replace('_', ' ')}</span>
                </div>
                <span className="font-bold">{c.value} tickets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Payment Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm lg:col-span-2 flex flex-col">
        <h3 className="text-sm font-bold mb-4 tracking-tight">Hostel Fee Collection Overview</h3>
        <div className="h-64 flex-1 flex flex-col md:flex-row items-center justify-around">
          <div className="h-full w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {feesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FEE_COLORS[index % FEE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-1/3">
            {feesData.map((f, i) => (
              <div key={f.name} className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: FEE_COLORS[i % FEE_COLORS.length] }} />
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold">Payment Status</div>
                    <div className="text-sm font-bold capitalize">{f.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{f.value} Records</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
