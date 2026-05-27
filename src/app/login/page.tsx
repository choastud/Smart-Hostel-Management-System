'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth, TEST_ACCOUNTS } from '../../services/AuthContext';
import { 
  Lock, Mail, User, Shield, Sparkles, AlertCircle, ArrowLeft, ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';

function LoginPageContent() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<'student' | 'admin' | 'warden' | 'security' | 'mess_manager'>('student');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter an email address.');
      return;
    }

    const res = await login(email, role);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (mockEmail: string, mockRole: typeof role) => {
    setErrorMsg('');
    const res = await login(mockEmail, mockRole);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.message || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--background)] text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden grid-bg">
      
      {/* Decorative Background Blobs */}
      <div className="floating-blob blob-blue w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] -top-20 -left-20 opacity-12" />
      <div className="floating-blob blob-indigo w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bottom-10 right-10 opacity-10" />

      {/* Visual Banner Block (Left/Large Screens) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-650 to-indigo-800 p-12 text-white flex-col justify-between relative overflow-hidden shadow-lg">
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-black/10 rounded-full blur-2xl" />

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/" className="w-9 h-9 bg-white text-blue-600 rounded-lg flex items-center justify-center font-black text-lg hover:scale-105 transition-transform shadow-md">
            AH
          </Link>
          <span className="font-extrabold tracking-tight">AuraHost System</span>
        </div>

        <div className="space-y-6 relative z-10">
          <h3 className="text-3xl font-black leading-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Seamless hostel management & verification.
          </h3>
          <p className="text-sm text-blue-105 leading-relaxed font-medium">
            Switch between students, wardens, guards, and mess managers instantly using the credentials sandbox.
          </p>
        </div>

        <div className="text-xs text-blue-200 relative z-10 flex items-center gap-1">
          <span>&copy; AuraHost Automation Hub.</span>
          <Link href="/" className="hover:underline flex items-center gap-0.5 ml-2">
            Back to Home <ArrowUpRight size={10} />
          </Link>
        </div>
      </div>

      {/* Main Forms block (Right/Mobile Screens) */}
      <div className="lg:col-span-7 flex items-center justify-center p-8 md:p-12 overflow-y-auto relative z-10">
        
        {/* Top Right Quick Settings */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <ThemeToggle />
        </div>

        <motion.div 
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Sign in to access your portal dashboard
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-450 dark:text-zinc-550" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Simulation: any password is accepted."); }} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-450 dark:text-zinc-550" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-350 dark:border-zinc-750 text-blue-600 focus:ring-blue-500/20 accent-blue-600 bg-white dark:bg-zinc-900 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-xs font-semibold text-slate-500 dark:text-zinc-400 select-none cursor-pointer">
                Remember my credentials
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Role Portal</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(['student', 'warden', 'admin', 'security', 'mess_manager'] as typeof role[]).map((r) => (
                  <motion.button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer ${
                      role === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-550 shadow-xs'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing session...' : 'Access Dashboard'}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="text-center">
            <Link href="/register" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>

          {/* Sandbox Mock login accounts (Visual Helper) */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles size={12} className="text-blue-500 animate-pulse" />
              Developer Sandbox Accounts (Click to enter)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEST_ACCOUNTS.map((acc) => (
                <motion.button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email, acc.role)}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800/80 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold capitalize text-blue-600 dark:text-blue-400">
                    {acc.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold leading-tight truncate mt-1 text-slate-700 dark:text-zinc-200">
                    {acc.name.split(' (')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate block mt-0.5">
                    {acc.email}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
