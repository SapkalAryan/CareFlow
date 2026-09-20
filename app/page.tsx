'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  HeartPulse,
  Stethoscope,
  Users,
  Store,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
} from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role) {
        router.push(`/${role}/dashboard`);
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center space-y-16 py-16">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-100 via-indigo-100 to-sky-100 text-sky-800 text-xs font-bold border border-sky-200/80 shadow-xs animate-pulse">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>Production-Ready Doctor-Patient-Pharmacy Ecosystem</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Next-Generation Healthcare with{' '}
          <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
            CareFlow
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Unified clinical management platform powered by AI-assisted prescription structuring, real-time medical timelines, and privacy-first pharmacy fulfillment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/register">
            <Button
              size="lg"
              className="gap-2.5 text-base px-8 h-13 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold shadow-lg shadow-sky-500/25 hover:scale-105 transition-all"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>

          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-13 rounded-2xl font-bold border-slate-300 text-slate-700 hover:bg-slate-100 hover:scale-105 transition-all"
            >
              Sign In to Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Cards Section */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {/* Doctor Card */}
        <div className="group relative p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Doctor Portal</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Register patients, view complete medical histories, structure natural language instructions into validated prescriptions using GPT-4o-mini, and approve refill requests.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> AI Prescription Structuring
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> Patient Medical History
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> Refill Authorization Center
            </li>
          </ul>
        </div>

        {/* Patient Card */}
        <div className="group relative p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Patient Portal</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Access your personal medical timeline, track active prescriptions, place orders directly to receiving pharmacies, and request refill authorizations.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Real-time Event Timeline
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> One-click Pharmacy Orders
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Repeat Refill Requests
            </li>
          </ul>
        </div>

        {/* Pharmacy Card */}
        <div className="group relative p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Store className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Pharmacy Portal</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Receive sanitized fulfillment-relevant orders, update order status step-by-step, and automatically keep patients notified in real time.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Strict Data Sanitization
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Step-by-Step Fulfillment
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Instant Patient Sync
            </li>
          </ul>
        </div>
      </div>

      {/* Feature Badges Footer */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-semibold pt-8 border-t border-slate-200/60 max-w-4xl w-full">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600" /> NextAuth JWT + Bcrypt 12 Rounds
        </span>
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> OpenAI GPT-4o-mini Integration
        </span>
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" /> HIPAA Privacy Enforced
        </span>
      </div>
    </div>
  );
}
