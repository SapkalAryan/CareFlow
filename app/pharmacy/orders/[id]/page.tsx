'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Pill, User, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

function PharmacyOrderDetailContent({ params }: { params: { id: string } }) {

  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'order';

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [params.id, type]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'prescription' ? `/api/prescriptions/${params.id}` : `/api/orders/${params.id}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      const item = json.prescription || json.order;
      setRecord(item);
      if (item) setNewStatus(item.status);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setError('');
    setSuccess('');
    setIsUpdating(true);

    try {
      const endpoint = type === 'prescription' ? `/api/prescriptions/${params.id}` : `/api/orders/${params.id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: fulfillmentNotes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to update status');
        setIsUpdating(false);
        return;
      }

      setSuccess('Status updated successfully and patient timeline notified!');
      setTimeout(() => {
        fetchDetail();
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('An error occurred during update.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8 max-w-5xl mx-auto">
          <p className="text-slate-500">Record not found.</p>
        </div>
      </div>
    );
  }

  const code = record.prescriptionId || record.orderId;
  const items = record.items || [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Link href="/pharmacy/dashboard" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Pharmacy Dashboard
        </Link>

        {/* Privacy Header Alert */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Privacy Active: Showing fulfillment-relevant data ONLY. No clinical medical history or doctor notes.</span>
          </div>
          <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200 px-2 py-0.5 rounded text-emerald-900">
            Sanitized View
          </span>
        </div>

        {/* Overview Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-2xl text-slate-900">{code}</span>
              <StatusBadge status={record.status} />
            </div>
            <span className="text-xs text-slate-400">
              Created: {format(new Date(record.createdAt), 'MMMM d, yyyy • h:mm a')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient Contact Details
              </h3>
              <p className="text-base font-bold text-slate-900">{record.patientName || 'Patient'}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone: {record.contactNumber || record.patientPhone || 'N/A'}
              </p>
              {record.deliveryAddress && (
                <p className="text-xs text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>Address: {record.deliveryAddress}</span>
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-slate-400" /> Total Items Count
              </h3>
              <p className="text-2xl font-extrabold text-sky-700">{items.length} Medication(s)</p>
              <p className="text-xs text-slate-500">Requires fulfillment verification</p>
            </div>
          </div>
        </div>

        {/* Medications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Medications to Dispense</h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{item.medicineName}</span>
                    <span className="px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">
                      {item.strength}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Dosage: {item.dosage} • Frequency: {item.frequency} • Timing: {item.timing}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Quantity</span>
                  <span className="text-lg font-bold text-slate-900">{item.quantity} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Update Fulfillment Status</h3>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Fulfillment Status</label>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="ACCEPTED">ACCEPTED (Order Accepted)</option>
                  <option value="PROCESSING">PROCESSING (Preparation in progress)</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP / READY (Ready for patient)</option>
                  <option value="DISPENSED">DISPENSED (Handed to patient)</option>
                  <option value="PARTIALLY_AVAILABLE">PARTIALLY_AVAILABLE (Partial stock)</option>
                  <option value="CANCELLED">CANCELLED (Cannot fulfill)</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Fulfillment Note (Optional)</label>
                <Textarea
                  placeholder="e.g. Ready for pickup at Counter 2"
                  rows={2}
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={isUpdating} className="px-6 font-bold">
                Save & Update Patient Timeline
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PharmacyOrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
      <PharmacyOrderDetailContent params={params} />
    </Suspense>
  );
}

