'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../services/AuthContext';

export default function DashboardGatewayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        const rolePaths: Record<string, string> = {
          student: '/dashboard/student',
          warden: '/dashboard/warden',
          admin: '/dashboard/warden',
          security: '/dashboard/security',
          mess_manager: '/dashboard/mess-manager',
        };
        const targetPath = rolePaths[user.role] || '/dashboard/student';
        router.replace(targetPath);
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-slate-400">Resolving profile environment...</p>
    </div>
  );
}
