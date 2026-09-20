'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { HeartPulse, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 group">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
            CareFlow
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {session && user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800">{user.name}</span>
                <span className="text-xs text-sky-600 font-semibold capitalize flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  {user.role} Portal
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="gap-2 rounded-xl text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700 hover:text-sky-600 rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-bold rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-sm shadow-sky-500/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
