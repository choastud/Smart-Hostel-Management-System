'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-charcoal flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Redirecting to login portal...</p>
    </div>
  );
}
