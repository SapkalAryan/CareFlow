'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, CheckCircle, XCircle, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorRefillsPage() {
  const [refills, setRefills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

  // Selected request modal / action state
  const [selectedRefill, setSelectedRefill] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'CONSULTATION_REQUESTED' | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRefills();
  }, []);

  const fetchRefills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refills');
      const data = await res.json();
      setRefills(data.refills || []);
    } catch (err) {
      console.error('Error loading refills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefill || !actionType) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/refills/${selectedRefill._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType,
          doctorNotes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to update refill request');
        setIsSubmitting(false);
        return;
      }

      setSuccess(`Refill request ${actionType.replace(/_/g, ' ')} successfully!`);
      setTimeout(() => {
        setSelectedRefill(null);
        setActionType(null);
        setDoctorNotes('');
        setSuccess('');
        fetchRefills();
      }, 1200);
    } catch (err) {
      setError('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefills =
    activeTab === 'PENDING'
      ? refills.filter((r) => r.status === 'PENDING')
      : refills;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Refill Authorization Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review patient medication refill requests and issue authorized repeat prescriptions.
          </p>
        </div>

        {/* Tabs Filter */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'PENDING'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Pending Approval (
            {refills.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ALL'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All History ({refills.length})
          </button>
        </div>

        {/* Refills List */}
        {loading ? (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
          </div>
        ) : filteredRefills.length === 0 ? (
          <EmptyState
            title="No refill requests found"
            description={
              activeTab === 'PENDING'
                ? 'All patient refill requests have been processed. Clean slate!'
                : 'No refill requests recorded yet.'
            }
            icon={RefreshCw}
          />
        ) : (
          <div className="space-y-4">
            {filteredRefills.map((refill) => {
              const patient = refill.patientId;
              const user = patient?.userId;
              const rx = refill.prescriptionId;

              return (
                <div key={refill._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{user?.fullName || 'Patient'}</h3>
                      <StatusBadge status={refill.status} />
                    </div>
                    <span className="text-xs text-slate-400">
                      Requested: {format(new Date(refill.requestedAt), 'MMMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700">Prescription Details</span>
                      <p className="text-slate-600">Rx Code: <span className="font-semibold text-sky-700">{rx?.prescriptionId}</span></p>
                      <p className="text-slate-500">
                        Medication(s): {rx?.items?.map((i: any) => `${i.medicineName} ${i.strength}`).join(', ')}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs space-y-1">
                      <span className="font-bold text-amber-900">Patient Reason / Note</span>
                      <p className="text-amber-800 italic">
                        "{refill.patientReason || 'No notes provided by patient.'}"
                      </p>
                    </div>
                  </div>

                  {refill.status === 'PENDING' ? (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRefill(refill);
                          setActionType('CONSULTATION_REQUESTED');
                        }}
                        className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <Stethoscope className="w-3.5 h-3.5 mr-1" /> Request Consultation
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedRefill(refill);
                          setActionType('REJECTED');
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Request
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          setSelectedRefill(refill);
                          setActionType('APPROVED');
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Issue Refill
                      </Button>
                    </div>
                  ) : (
                    refill.doctorNotes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">Doctor Decision Notes: </span>
                        {refill.doctorNotes}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {selectedRefill && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                Confirm Refill Action: {actionType.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-bold text-slate-800">{selectedRefill.patientId?.userId?.fullName}</span> • Rx:{' '}
                {selectedRefill.prescriptionId?.prescriptionId}
              </p>

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

              <form onSubmit={handleProcessRefill} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Doctor Clinical Notes / Instructions</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter instructions or reason for decision..."
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedRefill(null);
                      setActionType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={actionType === 'APPROVED' ? 'success' : actionType === 'REJECTED' ? 'danger' : 'primary'}
                    isLoading={isSubmitting}
                  >
                    Submit Decision
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
