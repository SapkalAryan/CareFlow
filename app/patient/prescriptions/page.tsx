'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, ShoppingBag, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Refill Request
  const [selectedRxForRefill, setSelectedRxForRefill] = useState<any | null>(null);
  const [refillReason, setRefillReason] = useState('');
  const [refillError, setRefillError] = useState('');
  const [refillSuccess, setRefillSuccess] = useState('');
  const [isRefilling, setIsRefilling] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions');
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRxForRefill) return;

    setRefillError('');
    setRefillSuccess('');
    setIsRefilling(true);

    try {
      const res = await fetch('/api/refills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: selectedRxForRefill._id,
          reason: refillReason,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setRefillError(json.error || 'Failed to submit refill request');
        setIsRefilling(false);
        return;
      }

      setRefillSuccess('Refill request submitted to your doctor!');
      setTimeout(() => {
        setSelectedRxForRefill(null);
        setRefillReason('');
        setRefillSuccess('');
      }, 1500);
    } catch (err) {
      setRefillError('An unexpected error occurred.');
    } finally {
      setIsRefilling(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
          <p className="text-xs text-slate-500 mt-1">
            View all official prescriptions issued by your attending doctors.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <EmptyState
            title="No prescriptions on record"
            description="You do not have any active or past prescriptions. When your doctor issues a prescription, it will appear here."
            icon={FileText}
          />
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => {
              const doctor = rx.doctorId;
              const doctorUser = doctor?.userId;
              const pharmacy = rx.pharmacyId;

              return (
                <div key={rx._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xl text-sky-700">{rx.prescriptionId}</span>
                        <StatusBadge status={rx.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Prescribed by: <span className="font-semibold text-slate-800">{doctorUser?.fullName || 'Doctor'}</span> ({doctor?.specialization || 'General'})
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 sm:text-right">
                      <p>Date: {format(new Date(rx.createdAt), 'MMMM d, yyyy')}</p>
                      <p className="text-slate-500">Pharmacy: {pharmacy?.pharmacyName || 'Assigned Pharmacy'}</p>
                    </div>
                  </div>

                  {/* Medications Grid */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescribed Medications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rx.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{item.medicineName}</span>
                            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                              {item.strength}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">
                            {item.dosage} • {item.frequency} • {item.timing}
                          </p>
                          <p className="text-xs text-slate-500">
                            Duration: {item.duration} (Quantity: {item.quantity})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {rx.followUpDate && (
                        <span>Follow-up scheduled: <strong className="text-slate-800">{format(new Date(rx.followUpDate), 'MMM d, yyyy')}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRxForRefill(rx)}
                        className="gap-1.5 text-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        Request Refill
                      </Button>

                      <Link href={`/patient/orders?prescriptionId=${rx._id}`}>
                        <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Order Medicines
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refill Request Modal */}
        {selectedRxForRefill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 relative">
              <button
                onClick={() => setSelectedRxForRefill(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">Request Prescription Refill</h3>
                <p className="text-xs text-slate-500">
                  Prescription ID: <span className="font-bold text-sky-700">{selectedRxForRefill.prescriptionId}</span>
                </p>
              </div>

              {refillError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{refillError}</span>
                </div>
              )}

              {refillSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{refillSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRefillSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason for Refill Request (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g. Current 30-day supply is running low, feeling stable on medication."
                    rows={3}
                    value={refillReason}
                    onChange={(e) => setRefillReason(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRxForRefill(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isRefilling}>
                    Submit Request to Doctor
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
