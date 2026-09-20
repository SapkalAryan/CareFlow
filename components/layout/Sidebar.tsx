'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  FilePlus,
  RefreshCw,
  Clock,
  FileText,
  ShoppingBag,
  Store,
  ShieldCheck,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  if (!role) return null;

  const doctorNav = [
    { label: 'Overview', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Patients List', href: '/doctor/patients', icon: Users },
    { label: 'New AI Prescription', href: '/doctor/prescriptions/new', icon: FilePlus },
    { label: 'Refill Requests', href: '/doctor/refills', icon: RefreshCw },
  ];

  const patientNav = [
    { label: 'Overview', href: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Medical Timeline', href: '/patient/timeline', icon: Clock },
    { label: 'My Prescriptions', href: '/patient/prescriptions', icon: FileText },
    { label: 'My Orders', href: '/patient/orders', icon: ShoppingBag },
  ];

  const pharmacyNav = [
    { label: 'Fulfillment Center', href: '/pharmacy/dashboard', icon: Store },
  ];

  let items = doctorNav;
  if (role === 'patient') items = patientNav;
  if (role === 'pharmacy') items = pharmacyNav;

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-slate-200/80 bg-white/90 backdrop-blur-md min-h-[calc(100vh-4rem)] p-5">
      <div className="space-y-6">
        <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100/80">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
            Active Portal
          </p>
          <p className="text-sm font-bold text-slate-900 capitalize flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            {role} Interface
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Navigation Menu
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-500/20 scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
