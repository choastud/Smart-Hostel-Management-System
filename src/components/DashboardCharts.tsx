'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { BarChart3, AreaChart as AreaIcon } from 'lucide-react';

interface ChartProps {
  roomsData: { hostel: string; capacity: number; occupied: number }[];
  complaintsData: { name: string; value: number }[];
  feesData: { name: string; value: number }[];
}

export default function DashboardCharts({ roomsData, complaintsData, feesData }: ChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [hoveredComplaintIndex, setHoveredComplaintIndex] = useState<number | null>(null);
  const [hoveredFeeIndex, setHoveredFeeIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial dark mode
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-80 animate-pulse bg-slate-50 dark:bg-zinc-800/40 rounded-xl" />
    );
  }

  // Visual Theme Variables
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(226,232,240,0.8)';
  const textColor = isDark ? '#71717a' : '#94A3B8';
  const capacityBarColor = isDark ? '#1e1e24' : '#f1f5f9';

  // Gradient definitions (mapped color sets)
  const COMPLAINT_COLORS = ['url(#blueGrad)', 'url(#orangeGrad)', 'url(#emeraldGrad)', 'url(#redGrad)'];
  const COMPLAINT_SOLID_COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444'];
  
  const getComplaintColor = (name: string, index: number) => {
    const status = name.toLowerCase();
    if (status === 'pending') return 'url(#blueGrad)';
    if (status === 'in_progress') return 'url(#orangeGrad)';
    if (status === 'resolved' || status === 'completed') return 'url(#emeraldGrad)';
    return COMPLAINT_COLORS[index % COMPLAINT_COLORS.length];
  };

  const getComplaintSolidColor = (name: string, index: number) => {
    const status = name.toLowerCase();
    if (status === 'pending') return '#3b82f6';
    if (status === 'in_progress') return '#f97316';
    if (status === 'resolved' || status === 'completed') return '#10b981';
    return COMPLAINT_SOLID_COLORS[index % COMPLAINT_SOLID_COLORS.length];
  };

  const FEE_COLORS = ['url(#emeraldGrad)', 'url(#redGrad)', 'url(#amberGrad)'];
  const FEE_SOLID_COLORS = ['#10b981', '#ef4444', '#fbbf24'];

  const getFeeColor = (name: string, index: number) => {
    const status = name.toLowerCase();
    if (status === 'paid') return 'url(#emeraldGrad)';
    if (status === 'unpaid') return 'url(#redGrad)';
    if (status === 'overdue') return 'url(#amberGrad)';
    return FEE_COLORS[index % FEE_COLORS.length];
  };

  const getFeeSolidColor = (name: string, index: number) => {
    const status = name.toLowerCase();
    if (status === 'paid') return '#10b981';
    if (status === 'unpaid') return '#ef4444';
    if (status === 'overdue') return '#fbbf24';
    return FEE_SOLID_COLORS[index % FEE_SOLID_COLORS.length];
  };

  // Center values calculation on Hover
  const hoveredComplaint = hoveredComplaintIndex !== null ? complaintsData[hoveredComplaintIndex] : null;
  const complaintCenterVal = hoveredComplaint ? hoveredComplaint.value : complaintsData.reduce((acc, curr) => acc + curr.value, 0);
  const complaintCenterLabel = hoveredComplaint ? hoveredComplaint.name.replace('_', ' ') : 'Total';

  const hoveredFee = hoveredFeeIndex !== null ? feesData[hoveredFeeIndex] : null;
  const feeCenterVal = hoveredFee ? hoveredFee.value : feesData.reduce((acc, curr) => acc + curr.value, 0);
  const feeCenterLabel = hoveredFee ? hoveredFee.name : 'Total';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ----------------- ROOM OCCUPANCY CHART ----------------- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">Room Occupancy by Block</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Beds status</p>
          </div>
          {/* Toggle buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              }`}
            >
              <BarChart3 size={13} />
              <span className="hidden sm:inline">Bar</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'area'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
              }`}
            >
              <AreaIcon size={13} />
              <span className="hidden sm:inline">Area</span>
            </button>
          </div>
        </div>

        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={roomsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="occupiedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" vertical={false} stroke={gridColor} />
                <XAxis dataKey="hostel" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: textColor }} stroke={textColor} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: textColor }} stroke={textColor} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px', 
                    borderColor: isDark ? '#27272a' : '#e2e8f0', 
                    color: isDark ? '#f4f4f5' : '#1e293b',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                  labelStyle={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#0f172a' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="occupied" name="Occupied Beds" fill="url(#occupiedGrad)" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="capacity" name="Total Capacity" fill={capacityBarColor} radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            ) : (
              <AreaChart
                data={roomsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaOccupied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="areaCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#52525b' : '#cbd5e1'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={isDark ? '#52525b' : '#cbd5e1'} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" vertical={false} stroke={gridColor} />
                <XAxis dataKey="hostel" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: textColor }} stroke={textColor} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: textColor }} stroke={textColor} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px', 
                    borderColor: isDark ? '#27272a' : '#e2e8f0', 
                    color: isDark ? '#f4f4f5' : '#1e293b',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#0f172a' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="occupied" name="Occupied Beds" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#areaOccupied)" />
                <Area type="monotone" dataKey="capacity" name="Total Capacity" stroke={isDark ? '#52525b' : '#94a3b8'} strokeWidth={1.5} fillOpacity={1} fill="url(#areaCapacity)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ----------------- COMPLAINTS DISTRIBUTION CHART ----------------- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="mb-6">
          <h3 className="text-sm font-extrabold tracking-tight">Active Complaints Breakdown</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tickets Status</p>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
          {/* Centered Donut Container to prevent horizontal squashing */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#c2410c" />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
                <Pie
                  data={complaintsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(data, index) => setHoveredComplaintIndex(index)}
                  onMouseLeave={() => setHoveredComplaintIndex(null)}
                >
                  {complaintsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getComplaintColor(entry.name, index)} className="cursor-pointer outline-none focus:outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px', 
                    borderColor: isDark ? '#27272a' : '#e2e8f0',
                    color: isDark ? '#f4f4f5' : '#1e293b',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Dynamic Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 transition-all">
                {complaintCenterVal}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-center max-w-[80px] truncate transition-all">
                {complaintCenterLabel}
              </span>
            </div>
          </div>

          {/* List Legend */}
          <div className="flex-1 w-full flex flex-col gap-2.5 px-2">
            {complaintsData.map((c, i) => (
              <div 
                key={c.name} 
                onMouseEnter={() => setHoveredComplaintIndex(i)}
                onMouseLeave={() => setHoveredComplaintIndex(null)}
                className={`flex items-center justify-between text-xs p-2 rounded-xl border transition-all cursor-pointer ${
                  hoveredComplaintIndex === i 
                    ? 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getComplaintSolidColor(c.name, i) }} />
                  <span className="text-slate-500 dark:text-zinc-400 font-semibold capitalize">{c.name.replace('_', ' ')}</span>
                </div>
                <span className="font-extrabold">{c.value} tickets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------- FEE PAYMENT TRACKER CHART ----------------- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div className="mb-6">
          <h3 className="text-sm font-extrabold tracking-tight">Hostel Fee Collection Overview</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Billing Status</p>
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-8 py-2">
          {/* Centered Donut Container to prevent horizontal squashing */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <Pie
                  data={feesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(data, index) => setHoveredFeeIndex(index)}
                  onMouseLeave={() => setHoveredFeeIndex(null)}
                >
                  {feesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getFeeColor(entry.name, index)} className="cursor-pointer outline-none focus:outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px', 
                    borderColor: isDark ? '#27272a' : '#e2e8f0',
                    color: isDark ? '#f4f4f5' : '#1e293b',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Dynamic Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 transition-all">
                {feeCenterVal}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-center max-w-[80px] truncate transition-all">
                {feeCenterLabel}
              </span>
            </div>
          </div>

          {/* Cards Legend */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-1/2 justify-center">
            {feesData.map((f, i) => (
              <div 
                key={f.name}
                onMouseEnter={() => setHoveredFeeIndex(i)}
                onMouseLeave={() => setHoveredFeeIndex(null)}
                className={`bg-slate-50 dark:bg-zinc-850 p-4 rounded-2xl border flex items-center justify-between flex-1 cursor-pointer transition-all ${
                  hoveredFeeIndex === i 
                    ? 'border-blue-500 dark:border-blue-500 shadow-sm scale-[1.01]' 
                    : 'border-slate-100 dark:border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getFeeSolidColor(f.name, i) }} />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Status</div>
                    <div className="text-xs font-bold capitalize">{f.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-600 dark:text-blue-400">{f.value} Records</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
