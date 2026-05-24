'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, Sparkles, Compass, Users, CheckCircle, 
  ArrowRight, Key, CalendarCheck, HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    { title: 'Student Room Allocation', desc: 'Auto bed allocation, block/floor occupancy filters, and room change requests.', icon: Compass },
    { title: 'QR-Based Attendance', desc: 'Secure student check-in/out via dynamic QR generation and real-time logs.', icon: CalendarCheck },
    { title: 'Visitor Entry System', desc: 'Pre-register visitors with instant notifications for student approval.', icon: Users },
    { title: 'Complaint Board', desc: 'Submit and track maintenance requests directly with warden assignments.', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-beige dark:bg-brand-charcoal text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Premium Navbar */}
      <nav className="h-20 max-w-7xl mx-auto w-full px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            AH
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-tight tracking-tight">AuraHost</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hostel Automation</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/auth" className="text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Portal Log In
          </Link>
          <Link 
            href="/auth" 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
          >
            Launch System
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 text-center md:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full">
              <Sparkles size={12} />
              Hostel Operations Ecosystem
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Smarter living for <br/>
              <span className="text-blue-600">Modern Campus</span> hostels.
            </h2>
            
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              AuraHost automates allocations, security registers, attendance logs, mess feedback, and fee tracking. Built on Supabase to enable seamless coordination.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link 
                href="/auth" 
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Access Auth Portal
                <ArrowRight size={18} />
              </Link>
              <a 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 font-bold rounded-2xl transition-all flex items-center justify-center"
              >
                Learn Features
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Visual Glassmorphism Card Stack Mockup */}
            <div className="w-80 h-96 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl relative shadow-2xl overflow-hidden p-6 text-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Key size={20} />
                </div>
                <div>
                  <div className="text-xs text-blue-200 uppercase tracking-widest font-bold">Room 101 status</div>
                  <div className="text-2xl font-black">Occupied (3/3)</div>
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Student Resident</span>
                  <span className="font-bold">Rahul Sharma</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Attendance today</span>
                  <span className="bg-emerald-500 px-2 py-0.5 rounded font-extrabold">PRESENT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-zinc-900/50 border-y border-slate-100 dark:border-zinc-850">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center space-y-3 mb-16">
            <h3 className="text-2xl md:text-3xl font-extrabold">Feature Spotlight</h3>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">Everything required to operate college blocks efficiently, digitizing paperwork.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 card-hover flex flex-col gap-4">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1.5">{f.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-zinc-850">
        <span>&copy; {new Date().getFullYear()} AuraHost Inc. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
}
