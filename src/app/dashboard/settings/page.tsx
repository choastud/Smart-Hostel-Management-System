'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../../../services/supabaseClient';
import { 
  Settings, Key, Database, User, ShieldCheck, 
  HelpCircle, RefreshCw, AlertCircle, Info 
} from 'lucide-react';

export default function SettingsPage() {
  const { user, dbMode } = useAuth();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [errorStatus, setErrorStatus] = useState('');

  useEffect(() => {
    // Load config on mount
    const config = getSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url);
      setSupabaseKey(config.anonKey);
    }
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('');
    setErrorStatus('');

    if (!supabaseUrl.startsWith('https://')) {
      setErrorStatus('Supabase URL must start with https://');
      return;
    }

    if (supabaseKey.length < 50) {
      setErrorStatus('Invalid Anon Key format.');
      return;
    }

    try {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      setSaveStatus('Credentials saved successfully! Reloading connection adapters...');
      
      // Fire configuration changed event
      setTimeout(() => {
        window.dispatchEvent(new Event('shms_db_config_changed'));
        setSaveStatus('Connected! Database mode updated.');
      }, 1000);
    } catch (err: any) {
      setErrorStatus(err.message || 'Failed to save configuration');
    }
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to clear credentials and return to the Offline Local Storage database?')) return;
    
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setSaveStatus('Credentials cleared. Reloading connection adapters...');
    
    setTimeout(() => {
      window.dispatchEvent(new Event('shms_db_config_changed'));
      setSaveStatus('Disconnected. Offline mock mode active.');
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Details (Left) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <User size={16} className="text-blue-500" />
            Profile Account Details
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
              <span className="text-xs font-extrabold mt-1 block text-slate-800 dark:text-zinc-200">{user?.name}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
              <span className="text-xs font-mono font-bold mt-1 block text-slate-600 dark:text-zinc-300">{user?.email}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Role</span>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase mt-1 block">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Database Credentials panel (Right) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Database size={16} className="text-blue-500" />
              Supabase Database Connector
            </h3>
            <p className="text-xs text-slate-400">
              Configure your cloud connection credentials. If blank or invalid, the app defaults to client-side LocalStorage.
            </p>
          </div>

          <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            dbMode === 'supabase'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
              : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
          }`}>
            <Info size={18} />
            <div>
              <span className="font-extrabold capitalize">Active Mode: {dbMode.replace('_', ' ')}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {dbMode === 'supabase' 
                  ? 'All reads and writes are securely saving to your live PostgreSQL Supabase Cloud database.' 
                  : 'All operational records (allocations, visitors, feed menu) are sandbox-isolated inside this browser session.'}
              </p>
            </div>
          </div>

          {saveStatus && (
            <div className="p-4 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs font-semibold flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              {saveStatus}
            </div>
          )}

          {errorStatus && (
            <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              {errorStatus}
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supabase Project API URL</label>
              <input
                type="text"
                placeholder="https://xyz.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supabase Anon Public API Key</label>
              <textarea
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={!supabaseUrl || !supabaseKey}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex-1 disabled:opacity-50"
              >
                Save Connection Credentials
              </button>
              
              {dbMode === 'supabase' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-colors dark:border-red-900/30 dark:hover:bg-red-950/20 dark:text-red-400"
                >
                  Disconnect (Use Offline Mock DB)
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
