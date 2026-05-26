'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Profile, UserRole } from '../../../types';
import { 
  Users, Search, User, Mail, Phone, ChevronRight, ShieldAlert, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilesDirectoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | UserRole>('all');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const db = getDbService();
      let list: Profile[] = [];

      if (db.isSupabaseActive()) {
        const client = (db as any).getSupabaseClient?.();
        if (client) {
          const { data } = await client.from('profiles').select('*');
          list = data || [];
        }
      } else {
        list = JSON.parse(localStorage.getItem('shms_profiles') || '[]');
      }
      setProfiles(list);
    } catch (e) {
      console.error('Failed to load profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading profiles directory...</p>
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

  const roleColors: Record<string, string> = {
    student: 'text-blue-600 bg-blue-55/10 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    admin: 'text-rose-600 bg-rose-55/10 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
    warden: 'text-emerald-600 bg-emerald-55/10 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    security: 'text-purple-600 bg-purple-55/10 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
    mess_manager: 'text-amber-600 bg-amber-55/10 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  };

  // Filter profiles based on search query and active tab
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.phone && p.phone.includes(searchQuery));
    const matchesTab = activeTab === 'all' || p.role === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Users className="text-blue-650" size={22} />
            Profiles Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Explore occupant and staff directories across the campus blocks</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Directory Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
        {(['all', 'student', 'warden', 'security', 'mess_manager', 'admin'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-blue-650 bg-blue-650 text-white shadow-sm'
                : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 dark:text-zinc-400'
            }`}
          >
            {tab === 'all' ? 'All Profiles' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-3">
          <User className="w-12 h-12 text-slate-350 mx-auto" />
          <h4 className="text-sm font-bold text-slate-600 dark:text-zinc-300">No Profiles Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">We couldn't find any profiles matching your search or filters. Try adjusting your query parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(p => (
            <div 
              key={p.id} 
              className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-350 dark:hover:border-zinc-700/80 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {p.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-[160px] font-medium">ID: {p.id}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 border text-[9px] font-bold uppercase rounded-full select-none ${roleColors[p.role] || ''}`}>
                    {roleLabels[p.role] || p.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                  {p.phone && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                      <Phone size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.role === 'student' && p.gender && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                      <ShieldAlert size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="capitalize">{p.gender} block allocation</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Action Link */}
              <div className="border-t border-slate-50 dark:border-zinc-800/60 pt-4 mt-6 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Inspection portal</span>
                <Link 
                  href={`/dashboard/profiles/${p.id}`}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View details
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
