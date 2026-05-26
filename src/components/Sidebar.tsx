'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../services/AuthContext';
import { 
  LayoutDashboard, DoorOpen, CalendarCheck, AlertCircle, 
  Users, Utensils, CreditCard, Settings, LogOut, ShieldAlert
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'admin', 'warden', 'security', 'mess_manager'] },
  { name: 'Profiles Directory', href: '/dashboard/profiles', icon: Users, roles: ['student', 'admin', 'warden', 'security', 'mess_manager'] },
  { name: 'Room Allocation', href: '/dashboard/rooms', icon: DoorOpen, roles: ['student', 'admin', 'warden'] },
  { name: 'QR Attendance', href: '/dashboard/attendance', icon: CalendarCheck, roles: ['student', 'admin', 'warden', 'security'] },
  { name: 'Complaints', href: '/dashboard/complaints', icon: AlertCircle, roles: ['student', 'admin', 'warden'] },
  { name: 'Visitor logs', href: '/dashboard/visitors', icon: Users, roles: ['student', 'admin', 'warden', 'security'] },
  { name: 'Mess & Feedback', href: '/dashboard/mess', icon: Utensils, roles: ['student', 'admin', 'mess_manager'] },
  { name: 'Fee Tracking', href: '/dashboard/fees', icon: CreditCard, roles: ['student', 'admin'] },
  { name: 'System Settings', href: '/dashboard/settings', icon: Settings, roles: ['student', 'admin', 'warden', 'security', 'mess_manager'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) return null;

  // Filter items matching user role and dynamically resolve role dashboard paths
  const menuItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role)).map(item => {
    if (item.name === 'Dashboard') {
      const rolePaths: Record<string, string> = {
        student: '/dashboard/student',
        warden: '/dashboard/warden',
        admin: '/dashboard/warden',
        security: '/dashboard/security',
        mess_manager: '/dashboard/mess-manager',
      };
      return {
        ...item,
        href: rolePaths[user.role] || '/dashboard/student'
      };
    }
    return item;
  });

  const roleLabels: Record<string, string> = {
    student: 'Resident Student',
    admin: 'Hostel Admin',
    warden: 'Block Warden',
    security: 'Gate Security',
    mess_manager: 'Mess Manager',
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-full">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          AH
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">AuraHost</h1>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Smart Ecosystem</span>
        </div>
      </div>

      {/* User Info Badge */}
      <div className="p-4 mx-4 my-4 bg-slate-50 border border-slate-100 dark:bg-zinc-800/40 dark:border-zinc-800/80 rounded-xl">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Profile</div>
        <div className="font-bold text-sm text-slate-800 dark:text-zinc-200 truncate mt-1">{user.name}</div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded-full">
          <ShieldAlert size={10} />
          {roleLabels[user.role] || user.role}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const isActive = pathname === item.href || (item.name === 'Dashboard' && pathname === '/dashboard');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-250 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon 
                size={18} 
                className={`transition-transform duration-250 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200'}`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
        <button
          onClick={signOut}
          className="flex items-center gap-3.5 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-colors duration-200"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
