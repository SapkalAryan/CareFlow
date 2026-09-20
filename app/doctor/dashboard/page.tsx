'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, FileText, RefreshCw, Calendar, FilePlus, UserPlus, ArrowRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePrescriptions: 0,
    pendingRefills: 0,
    upcomingFollowUps: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [pendingRefills, setPendingRefills] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [patientsRes, prescriptionsRes, refillsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/prescriptions'),
        fetch('/api/refills'),
      ]);

      const patientsData = await patientsRes.json();
      const prescriptionsData = await prescriptionsRes.json();
      const refillsData = await refillsRes.json();

      const patients = patientsData.patients || [];
      const prescriptions = prescriptionsData.prescriptions || [];
      const refills = refillsData.refills || [];

      const activeRx = prescriptions.filter(
        (p: any) => p.status !== 'CANCELLED' && p.status !== 'COMPLETED'
      );
      const pendingRef = refills.filter((r: any) => r.status === 'PENDING');
      const followUps = prescriptions.filter(
        (p: any) => p.followUpDate && new Date(p.followUpDate) >= new Date()
      );

      setStats({
        totalPatients: patients.length,
        activePrescriptions: activeRx.length,
        pendingRefills: pendingRef.length,
        upcomingFollowUps: followUps.length,
      });

      setRecentPrescriptions(prescriptions.slice(0, 5));
      setPendingRefills(pendingRef.slice(0, 5));
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Doctor Portal</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage patient clinical care, structured AI prescriptions, and refills.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/doctor/patients">
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                Add Patient
              </Button>
            </Link>
            <Link href="/doctor/prescriptions/new">
              <Button variant="primary" className="gap-2">
                <FilePlus className="w-4 h-4" />
                New AI Prescription
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : (
            <>
              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                description="Assigned clinical patients"
                icon={Users}
                iconColor="text-sky-600"
                bgColor="bg-sky-50"
              />
              <StatCard
                title="Active Prescriptions"
                value={stats.activePrescriptions}
                description="Issued active medications"
                icon={FileText}
                iconColor="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <StatCard
                title="Pending Refills"
                value={stats.pendingRefills}
                description="Awaiting your approval"
                icon={RefreshCw}
                iconColor="text-amber-600"
                bgColor="bg-amber-50"
              />
              <StatCard
                title="Upcoming Follow-ups"
                value={stats.upcomingFollowUps}
                description="Scheduled consultations"
                icon={Calendar}
                iconColor="text-emerald-600"
                bgColor="bg-emerald-50"
              />
            </>
          )}
        </div>

        {/* Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Refills Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pending Refill Requests</h2>
                  <p className="text-xs text-slate-500">Requires doctor authorization</p>
                </div>
              </div>
              <Link href="/doctor/refills">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : pendingRefills.length === 0 ? (
              <EmptyState
                title="No pending refill requests"
                description="When patients request medication refills, they will appear here for your review."
                icon={RefreshCw}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRefills.map((refill) => (
                  <div key={refill._id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">
                        {refill.patientId?.userId?.fullName || 'Patient'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Rx ID: {refill.prescriptionId?.prescriptionId} • Requested{' '}
                        {format(new Date(refill.requestedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Link href="/doctor/refills">
                      <Button size="sm" variant="outline" className="text-xs">
                        Review Request
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Prescriptions Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Prescriptions</h2>
                  <p className="text-xs text-slate-500">Latest structured prescriptions issued</p>
                </div>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : recentPrescriptions.length === 0 ? (
              <EmptyState
                title="No prescriptions created yet"
                description="Start by creating your first AI-structured prescription for a patient."
                icon={FilePlus}
                actionLabel="Create Prescription"
                onAction={() => (window.location.href = '/doctor/prescriptions/new')}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPrescriptions.map((rx) => (
                  <div key={rx._id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-sky-700">{rx.prescriptionId}</span>
                        <StatusBadge status={rx.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: {rx.patientId?.userId?.fullName || 'N/A'} • {rx.items?.length || 0}{' '}
                        medication(s)
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {format(new Date(rx.createdAt), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
