'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../services/AuthContext';
import { getDbService } from '../services/db';
import { Notification } from '../types';
import { 
  Bell, CheckCircle2, AlertTriangle, Coins, 
  Sparkles
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, dbMode } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const db = getDbService();
      const list = await db.getNotifications(user.id);
      setNotifications(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 5000); // refresh every 5s
    return () => clearInterval(timer);
  }, [user]);

  if (!user) return null;

  // Resolve Page Title from Route
  const getPageTitle = () => {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'dashboard') return 'Overview Dashboard';
    if (lastSegment === 'rooms') return 'Room Allocations';
    if (lastSegment === 'attendance') return 'QR Attendance Log';
    if (lastSegment === 'complaints') return 'Complaint Board';
    if (lastSegment === 'visitors') return 'Visitor Entry Log';
    if (lastSegment === 'mess') return 'Mess Menu & Feedback';
    if (lastSegment === 'fees') return 'Fee Payment & Receipt';
    if (lastSegment === 'settings') return 'System Configuration';
    return 'Hostel Management';
  };

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    try {
      const db = getDbService();
      await db.markNotificationAsRead(notifId);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'complaint': return <AlertTriangle className="text-orange-500" size={16} />;
      case 'fee': return <Coins className="text-red-500" size={16} />;
      case 'visitor': return <Sparkles className="text-purple-500" size={16} />;
      default: return <Bell className="text-blue-500" size={16} />;
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{getPageTitle()}</h2>
        <p className="text-xs text-slate-400">Smart Hostel Management System</p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 relative">
        {/* DB Connection Badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          dbMode === 'supabase'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${dbMode === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {dbMode === 'supabase' ? 'Supabase Database' : 'LocalStorage Offline Fallback'}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-xl relative transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold dark:bg-blue-950/40 dark:text-blue-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-700/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                    <CheckCircle2 size={24} className="text-slate-300" />
                    All caught up! No notifications.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`p-4 text-left transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-700/40 ${
                        !n.is_read ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${!n.is_read ? 'text-slate-800 dark:text-zinc-200' : 'text-slate-500'}`}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{n.message}</p>
                          <span className="text-[9px] text-slate-300 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
