'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, Menu, Compass, CalendarCheck, Users, 
  ShieldAlert, Sparkles, ArrowRight, Key, CalendarClock, CreditCard
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const navigation = [
    { name: "Home", href: "#" },
    { name: "Features", href: "#features" },
  ];

  const categories = [
    {
      title: "Student Portal",
      image: "/student_portal.png",
      href: "/login",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Warden Dashboard",
      image: "/warden_portal.png",
      href: "/login",
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Security Gate",
      image: "/security_gate.png",
      href: "/login",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Mess & Fees",
      image: "/mess_fees.png",
      href: "/login",
      color: "text-amber-600 dark:text-amber-400"
    },
  ];

  const features = [
    { title: 'Student Room Allocation', desc: 'Auto bed allocation, block/floor occupancy filters, and room change requests.', icon: Compass },
    { title: 'QR-Based Attendance', desc: 'Secure student check-in/out via dynamic QR generation and real-time logs.', icon: CalendarClock },
    { title: 'Visitor Entry System', desc: 'Pre-register visitors with instant notifications for student approval.', icon: Users },
    { title: 'Complaint Board', desc: 'Submit and track maintenance requests directly with warden assignments.', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-beige dark:bg-brand-charcoal text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* CommerceHero Container */}
      <div className="w-full relative container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl flex-1 flex flex-col pt-6 pb-16">
        
        {/* Animated Inner Header / Section Panel */}
        <div className="bg-slate-50/60 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl relative overflow-hidden shadow-sm flex-1 flex flex-col justify-between">
          
          <header className="flex items-center w-full z-30">
            {/* Left Header Section */}
            <div className="w-full md:w-2/3 lg:w-1/2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm p-4 rounded-br-3xl border-r border-b border-slate-200/50 dark:border-zinc-800/50 flex items-center gap-6">
              <Link href="#" className="text-xl font-extrabold tracking-tight flex items-center gap-2 select-none">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                  AH
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
                  AuraHost_
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-4">
                {navigation.map((item) => (
                  <a 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "cursor-pointer relative group hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 text-slate-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider"
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </nav>

              {/* Mobile Navigation Drawer Toggle */}
              <Sheet>
                <SheetTrigger asChild className="lg:hidden ml-auto">
                  <Button variant="ghost" size="icon" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[300px] sm:w-[400px] p-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-r border-slate-200/50 dark:border-zinc-800/50"
                >
                  <SheetHeader className="p-6 text-left border-b border-slate-100 dark:border-zinc-900">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                        AH
                      </div>
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
                        AuraHost_
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col p-6 space-y-1">
                    {navigation.map((item) => (
                      <a 
                        key={item.name}
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "justify-start px-2 h-12 text-base font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-blue-600 transition-colors flex items-center"
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </nav>
                  <Separator className="mx-6" />
                  <div className="p-6 flex flex-col gap-3">
                    <Link 
                      href="/login"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full h-12 flex items-center justify-center font-bold"
                      )}
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/register"
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center font-bold"
                      )}
                    >
                      Sign Up
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Right Asymmetrical Header Section */}
            <div className="hidden md:flex w-1/2 justify-end items-center pr-6 gap-3 ml-auto">
              <Link 
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 cursor-pointer"
                )}
              >
                Log In
              </Link>
              <Link 
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 h-10 flex items-center justify-center text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                )}
              >
                Sign Up
              </Link>
            </div>
          </header>

          {/* Animated Hero Content Section */}
          <motion.section
            className="w-full px-6 py-20 md:py-28 flex-1 flex flex-col justify-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100/50 dark:border-blue-900/30">
                <Sparkles size={11} className="animate-pulse" />
                Modern Campus Housing Ecosystem
              </div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Automate your campus
                </span>
                <br />
                <span className="text-slate-900 dark:text-white">
                  housing operations.
                </span>
              </motion.h1>

              <motion.p
                className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                AuraHost handles student room allocations, guest check-ins, automated attendance logs, and dining feedback. Built with dual client-offline storage adapter and Supabase.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                <Link 
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full sm:w-auto h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 rounded-full font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  )}
                >
                  Launch Core Portal
                  <ArrowRight size={16} />
                </Link>
                <a 
                  href="#features"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full sm:w-auto h-12 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-bold px-8 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center"
                  )}
                >
                  Explore Modules
                </a>
              </motion.div>
            </div>
          </motion.section>
        </div>

        {/* Hover-Expanding Platform Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full mt-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              className="group relative bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl p-5 min-h-[260px] sm:min-h-[290px] w-full overflow-hidden border border-slate-200/50 dark:border-zinc-800/60 transition-all duration-500 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-zinc-700/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <Link href={category.href} className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight relative z-10 transition-colors duration-300 ${category.color}`}>
                    {category.title}
                  </h3>
                </div>
                
                {/* 3D Illustration Containment */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full max-w-[120px] sm:max-w-[130px] h-auto object-contain opacity-90 group-hover:scale-115 group-hover:rotate-6 transition-all duration-500 select-none pointer-events-none"
                  />
                </div>

                {/* Micro-Animated Arrow Button in Bottom-Right */}
                <div className="absolute bottom-0 right-0 w-14 h-14 bg-white dark:bg-zinc-950 rounded-tl-2xl flex items-center justify-center z-10 border-l border-t border-slate-200/40 dark:border-zinc-850/60 shadow-sm">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <ArrowUpRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-45" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-slate-50/80 dark:bg-zinc-900/20 border-y border-slate-100 dark:border-zinc-850/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center space-y-3 mb-16">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Feature Spotlight</h3>
            <p className="text-slate-500 max-w-lg mx-auto text-sm font-medium">Everything required to operate college blocks efficiently, digitizing paperwork.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 card-hover flex flex-col gap-4">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base mb-1.5">{f.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{f.desc}</p>
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
