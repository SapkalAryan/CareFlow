'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { TimelineFeed } from '@/components/dashboard/TimelineFeed';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, Calendar, Droplet, MapPin, FilePlus, ArrowLeft, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorPatientDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'timeline'>('prescriptions');

  useEffect(() => {
    fetchPatientDetail();
  }, [params.id]);

  const fetchPatientDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${params.id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error loading patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8 max-w-7xl mx-auto">
          <EmptyState
            title="Patient Profile Not Found"
            description="The requested patient record could not be found or you do not have permission to view it."
            actionLabel="Back to Patients Directory"
            onAction={() => (window.location.href = '/doctor/patients')}
          />
        </div>
      </div>
    );
  }

  const patient = data.patient;
  const user = patient.userId;
  const prescriptions = data.prescriptions || [];
  const timelineEvents = data.timelineEvents || [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Link href="/doctor/patients" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Directory
        </Link>

        {/* Patient Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-2xl shrink-0">
              {user?.fullName?.charAt(0) || 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{user?.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">
                  {patient.bloodGroup}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {user?.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: {patient.dateOfBirth} ({patient.gender})
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address: {patient.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/doctor/prescriptions/new?patientId=${patient._id}`}>
              <Button variant="primary" className="gap-2 shadow-sm">
                <FilePlus className="w-4 h-4" />
                Issue AI Prescription
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'prescriptions'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" /> Medical Timeline ({timelineEvents.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'prescriptions' ? (
          prescriptions.length === 0 ? (
            <EmptyState
              title="No prescriptions written yet"
              description="Click 'Issue AI Prescription' above to create the first prescription for this patient."
              icon={FilePlus}
              actionLabel="Issue AI Prescription"
              onAction={() => (window.location.href = `/doctor/prescriptions/new?patientId=${patient._id}`)}
            />
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx: any) => (
                <div key={rx._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-sky-700">{rx.prescriptionId}</span>
                      <StatusBadge status={rx.status} />
                      {rx.aiStructured && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                          AI Structured
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      Created on {format(new Date(rx.createdAt), 'MMMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  {/* Medications List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescription Medications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rx.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{item.medicineName}</span>
                            <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {item.strength}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {item.dosage} • {item.frequency} • {item.timing}
                          </p>
                          <p className="text-xs text-slate-500">
                            Duration: {item.duration} (Qty: {item.quantity})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.additionalNotes && (
                    <div className="text-xs text-slate-600 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                      <span className="font-bold text-sky-800">Doctor Notes: </span>
                      {rx.additionalNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <TimelineFeed events={timelineEvents} />
          </div>
        )}
      </div>
    </div>
  );
}
