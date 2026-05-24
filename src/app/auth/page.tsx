'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth, TEST_ACCOUNTS } from '../../services/AuthContext';
import { 
  Lock, Mail, User, Phone, Shield, Sparkles, AlertCircle 
} from 'lucide-react';

function AuthPageContent() {
  const { user, login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

    if (isLogin) {
      const res = await login(email, role);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message || 'Login failed');
      }
    } else {
      if (!name) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const res = await register(email, name, role, phone);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-brand-beige dark:bg-brand-charcoal text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Visual Banner Block (Left/Large Screens) */}
      <div className="hidden lg:flex lg:col-span-5 bg-blue-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Abstract circles */}
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-black/10 rounded-full blur-2xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 bg-white text-blue-600 rounded-lg flex items-center justify-center font-black text-lg">
            AH
          </div>
          <span className="font-extrabold tracking-tight">AuraHost System</span>
        </div>

        <div className="space-y-6 relative z-10">
          <h3 className="text-3xl font-black leading-tight">
            Seamless hostel management & verification.
          </h3>
          <p className="text-sm text-blue-100 leading-relaxed">
            Switch between students, wardens, guards, and mess managers instantly using the credentials sandbox.
          </p>
        </div>

        <div className="text-xs text-blue-200 relative z-10">
          &copy; AuraHost Automation Hub.
        </div>
      </div>

      {/* Main Forms block (Right/Mobile Screens) */}
      <div className="lg:col-span-7 flex items-center justify-center p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {isLogin ? 'Sign in to access your portal' : 'Register a new hostel occupant account'}
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
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Role Portal</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(['student', 'warden', 'admin', 'security', 'mess_manager'] as typeof role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold capitalize transition-colors ${
                      role === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing session...' : isLogin ? 'Access Dashboard' : 'Complete Registration'}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
            </button>
          </div>

          {/* Sandbox Mock login accounts (Visual Helper) */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles size={12} className="text-blue-500 animate-pulse" />
              Developer Sandbox Accounts (Click to enter)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email, acc.role)}
                  className="p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 dark:bg-zinc-850 dark:border-zinc-800 text-left rounded-xl hover:bg-slate-100 transition-all flex flex-col justify-between"
                >
                  <span className="text-[10px] font-extrabold capitalize text-blue-600 dark:text-blue-400">
                    {acc.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold leading-tight truncate mt-1 text-slate-700 dark:text-zinc-300">
                    {acc.name.split(' (')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-mono truncate">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  );
}
