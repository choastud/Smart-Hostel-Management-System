'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { MessMenu, MessFeedback } from '../../../types';
import { 
  Utensils
} from 'lucide-react';
import Link from 'next/link';

export default function MessManagerDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messMenu, setMessMenu] = useState<MessMenu[]>([]);
  const [messFeedback, setMessFeedback] = useState<MessFeedback[]>([]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const menuList = await db.getMessMenu();
      setMessMenu(menuList);
      
      const feedbackList = await db.getMessFeedback();
      setMessFeedback(feedbackList);

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
        <p className="text-xs font-bold text-slate-400">Loading cafeteria portal...</p>
      </div>
    );
  }

  if (!user || user.role !== 'mess_manager') {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. Mess Manager role credentials required.
      </div>
    );
  }

  const getAverageRating = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const list = messFeedback.filter(f => f.meal_type === meal);
    if (list.length === 0) return 'N/A';
    const sum = list.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / list.length).toFixed(1);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="p-8 bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-3xl text-white relative overflow-hidden shadow-md">
        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Mess Manager Dashboard</span>
          <h2 className="text-2xl font-black mt-2">Kitchen & Cafeteria Panel - {user?.name}</h2>
          <p className="text-xs text-emerald-100 max-w-md">
            Plan weekly student meal menus, inspect food reviews and ratings, and coordinate mess feedback logs.
          </p>
        </div>
        <div className="w-24 h-24 bg-white/10 rounded-full blur-xl absolute right-10 top-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Breakfast Rating</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
              <Utensils size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold leading-none tracking-tight block">
              {getAverageRating('breakfast')} ⭐
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Lunch Rating</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
              <Utensils size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold leading-none tracking-tight block">
              {getAverageRating('lunch')} ⭐
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Dinner Rating</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <Utensils size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold leading-none tracking-tight block">
              {getAverageRating('dinner')} ⭐
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Based on student ratings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold tracking-tight mb-2 flex items-center gap-2">
            <Utensils size={16} className="text-emerald-500" />
            Today's Menu Plan
          </h3>
          {messMenu.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No menu registered.</p>
          ) : (
            (() => {
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const todayName = days[new Date().getDay()];
              const todayMenu = messMenu.find(m => m.day_of_week === todayName) || messMenu[0];
              
              return (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="text-xs font-black text-blue-650 dark:text-blue-400 capitalize">{todayMenu.day_of_week} Menu Plan</div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[10px] font-black uppercase text-slate-400">Breakfast</div>
                    <div className="text-xs font-extrabold mt-0.5">{todayMenu.breakfast}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[10px] font-black uppercase text-slate-400">Lunch</div>
                    <div className="text-xs font-extrabold mt-0.5">{todayMenu.lunch}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[10px] font-black uppercase text-slate-400">Dinner</div>
                    <div className="text-xs font-extrabold mt-0.5">{todayMenu.dinner}</div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
            <Utensils size={16} className="text-yellow-500" />
            Latest Student Food Reviews
          </h3>
          {messFeedback.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No feedback records registered yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {messFeedback.slice(0, 5).map(f => (
                <div key={f.id} className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="font-extrabold capitalize text-slate-800 dark:text-zinc-200">{f.meal_type} rating</div>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1 italic font-medium">"{f.comment || 'No comment provided'}"</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-2">
                      By: <Link href={`/dashboard/profiles/${f.student_id}`} className="text-blue-650 hover:underline">{f.student_name || 'Anonymous'}</Link>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 text-xs font-black rounded-lg whitespace-nowrap">
                    {f.rating} ⭐
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
