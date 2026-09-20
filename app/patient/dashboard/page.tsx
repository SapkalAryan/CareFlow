'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ShoppingBag,
  Clock,
  RefreshCw,
  ArrowRight,
  Pill,
} from 'lucide-react';
import { format } from 'date-fns';
import AyurvedicChatbot from '@/components/AyurvedicChatbot';

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [refills, setRefills] = useState<any[]>([]);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [rxRes, ordRes, refRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/orders'),
        fetch('/api/refills'),
      ]);

      const rxData = await rxRes.json();
      const ordData = await ordRes.json();
      const refData = await refRes.json();

      setPrescriptions(rxData.prescriptions || []);
      setOrders(ordData.orders || []);
      setRefills(refData.refills || []);
    } catch (err) {
      console.error('Error fetching patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const activePrescriptions = prescriptions.filter(
    (p) => p.status !== 'CANCELLED' && p.status !== 'COMPLETED'
  );
  const pendingOrders = orders.filter(
    (o) => o.status !== 'DISPENSED' && o.status !== 'CANCELLED'
  );

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Patient Health Portal
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track your prescriptions, order medications, and view your complete medical timeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/patient/prescriptions">
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  View Prescriptions
                </Button>
              </Link>
              <Link href="/patient/orders">
                <Button variant="primary" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Order Medicines
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))
            ) : (
              <>
                <StatCard
                  title="Active Prescriptions"
                  value={activePrescriptions.length}
                  description="Current ongoing medications"
                  icon={FileText}
                  iconColor="text-sky-600"
                  bgColor="bg-sky-50"
                />
                <StatCard
                  title="Pending Orders"
                  value={pendingOrders.length}
                  description="Orders being processed by pharmacy"
                  icon={ShoppingBag}
                  iconColor="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <StatCard
                  title="Refill Requests"
                  value={refills.length}
                  description="Submitted repeat requests"
                  icon={RefreshCw}
                  iconColor="text-indigo-600"
                  bgColor="bg-indigo-50"
                />
                <StatCard
                  title="Medical Timeline"
                  value="Active"
                  description="Complete event history logged"
                  icon={Clock}
                  iconColor="text-emerald-600"
                  bgColor="bg-emerald-50"
                />
              </>
            )}
          </div>

          {/* Recent Prescriptions & Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Prescriptions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Active Prescriptions
                    </h2>
                    <p className="text-xs text-slate-500">Issued by your doctor</p>
                  </div>
                </div>
                <Link href="/patient/prescriptions">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : activePrescriptions.length === 0 ? (
                <EmptyState
                  title="No active prescriptions"
                  description="When your doctor issues a prescription, it will appear here."
                  icon={FileText}
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {activePrescriptions.slice(0, 4).map((rx) => (
                    <div
                      key={rx._id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-sky-700">
                            {rx.prescriptionId}
                          </span>
                          <StatusBadge status={rx.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Medications:{' '}
                          {rx.items?.map((i: any) => i.medicineName).join(', ')}
                        </p>
                      </div>
                      <Link href="/patient/orders">
                        <Button size="sm" variant="outline" className="text-xs">
                          Order Now
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medication Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Pharmacy Orders
                    </h2>
                    <p className="text-xs text-slate-500">Real-time status updates</p>
                  </div>
                </div>
                <Link href="/patient/orders">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : orders.length === 0 ? (
                <EmptyState
                  title="No orders placed yet"
                  description="Click 'Order Medicines' to send active prescriptions to a pharmacy for fulfillment."
                  icon={ShoppingBag}
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 4).map((ord) => (
                    <div
                      key={ord._id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {ord.orderId}
                          </span>
                          <StatusBadge status={ord.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pharmacy:{' '}
                          {ord.pharmacyId?.pharmacyName || 'Assigned Pharmacy'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(ord.createdAt), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Ayurvedic Chatbot (bottom-right corner) ============ */}
      <AyurvedicChatbot />
    </>
  );
}