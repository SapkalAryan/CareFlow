'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Store, ShoppingBag, Clock, CheckCircle2, ShieldCheck, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function PharmacyDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED'>('PENDING');

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const [ordRes, rxRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/prescriptions'),
      ]);

      const ordData = await ordRes.json();
      const rxData = await rxRes.json();

      setOrders(ordData.orders || []);
      setPrescriptions(rxData.prescriptions || []);
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchPharmacyData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleUpdateRxStatus = async (rxId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchPharmacyData();
      }
    } catch (err) {
      console.error('Error updating rx status:', err);
    }
  };

  // A prescription and its resulting order are the same fulfillment workflow.
  // Once a patient places an order, render the ORDER as the single source of truth
  // and hide the original direct-prescription card. This prevents duplicate queue entries.
  const orderedPrescriptionIds = new Set(
    orders
      .map((order) => order.prescriptionId?._id || order.prescriptionId)
      .filter(Boolean)
      .map((id) => id.toString())
  );

  const standalonePrescriptions = prescriptions.filter(
    (prescription) => !orderedPrescriptionIds.has(prescription._id.toString())
  );

  const pendingCount =
    orders.filter((o) => o.status === 'PENDING').length +
    standalonePrescriptions.filter((p) => p.status === 'SENT_TO_PHARMACY' || p.status === 'CREATED').length;

  const processingCount =
    orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PROCESSING').length +
    standalonePrescriptions.filter((p) => p.status === 'ACCEPTED' || p.status === 'PROCESSING').length;

  const readyCount =
    orders.filter((o) => o.status === 'READY').length +
    standalonePrescriptions.filter((p) => p.status === 'READY_FOR_PICKUP').length;

  const completedCount =
    orders.filter((o) => o.status === 'DISPENSED').length +
    standalonePrescriptions.filter((p) => p.status === 'DISPENSED' || p.status === 'COMPLETED').length;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pharmacy Fulfillment Center</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Privacy Enforced
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Sanitized prescription fulfillment views. Medical history & private clinical notes are excluded.
            </p>
          </div>
          <Button variant="outline" onClick={fetchPharmacyData} className="gap-2">
            <RefreshCw className="w-4 h-4 text-sky-600" /> Refresh Queue
          </Button>
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
                title="Pending Queue"
                value={pendingCount}
                description="New incoming requests"
                icon={Store}
                iconColor="text-sky-600"
                bgColor="bg-sky-50"
              />
              <StatCard
                title="In Processing"
                value={processingCount}
                description="Being prepared by pharmacist"
                icon={Clock}
                iconColor="text-amber-600"
                bgColor="bg-amber-50"
              />
              <StatCard
                title="Ready for Pickup"
                value={readyCount}
                description="Awaiting patient retrieval"
                icon={ShoppingBag}
                iconColor="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <StatCard
                title="Dispensed / Completed"
                value={completedCount}
                description="Fulfilling complete"
                icon={CheckCircle2}
                iconColor="text-emerald-600"
                bgColor="bg-emerald-50"
              />
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'PENDING'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('PROCESSING')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'PROCESSING'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            In Processing ({processingCount})
          </button>
          <button
            onClick={() => setActiveTab('READY')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'READY'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ready for Pickup ({readyCount})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'COMPLETED'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispensed ({completedCount})
          </button>
        </div>

        {/* Orders Fulfillment Queue */}
        {loading ? (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Render Direct Prescriptions */}
            {standalonePrescriptions.map((rx) => {
              const matchesTab =
                (activeTab === 'PENDING' && (rx.status === 'SENT_TO_PHARMACY' || rx.status === 'CREATED')) ||
                (activeTab === 'PROCESSING' && (rx.status === 'ACCEPTED' || rx.status === 'PROCESSING')) ||
                (activeTab === 'READY' && rx.status === 'READY_FOR_PICKUP') ||
                (activeTab === 'COMPLETED' && (rx.status === 'DISPENSED' || rx.status === 'COMPLETED'));

              if (!matchesTab) return null;

              return (
                <div key={rx._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-sky-700">{rx.prescriptionId}</span>
                      <StatusBadge status={rx.status} />
                      <span className="text-xs text-slate-400">Direct Prescription</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Received: {format(new Date(rx.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  {/* Sanitized Patient & Medicine Info (Strict Rule 2 Privacy) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">Patient Details (Sanitized)</span>
                      <p className="text-slate-900 font-semibold">{rx.patientName || 'Patient'}</p>
                      <p className="text-slate-600">Phone: {rx.patientPhone || 'N/A'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">Medications to Dispense</span>
                      <div className="space-y-1 pt-1">
                        {rx.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between font-medium text-slate-800">
                            <span>{item.medicineName} {item.strength} ({item.dosage})</span>
                            <span className="text-slate-500">Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Action Controls */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <Link href={`/pharmacy/orders/${rx._id}?type=prescription`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5" /> Fulfillment Details
                      </Button>
                    </Link>

                    {rx.status === 'SENT_TO_PHARMACY' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateRxStatus(rx._id, 'ACCEPTED')}
                      >
                        Accept & Start Order
                      </Button>
                    )}

                    {rx.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateRxStatus(rx._id, 'PROCESSING')}
                      >
                        Mark as Processing
                      </Button>
                    )}

                    {rx.status === 'PROCESSING' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateRxStatus(rx._id, 'READY_FOR_PICKUP')}
                      >
                        Mark Ready for Pickup
                      </Button>
                    )}

                    {rx.status === 'READY_FOR_PICKUP' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateRxStatus(rx._id, 'DISPENSED')}
                      >
                        Dispense to Patient
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Render Orders */}
            {orders.map((ord) => {
              const matchesTab =
                (activeTab === 'PENDING' && ord.status === 'PENDING') ||
                (activeTab === 'PROCESSING' && (ord.status === 'ACCEPTED' || ord.status === 'PROCESSING')) ||
                (activeTab === 'READY' && ord.status === 'READY') ||
                (activeTab === 'COMPLETED' && ord.status === 'DISPENSED');

              if (!matchesTab) return null;

              return (
                <div key={ord._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-slate-900">{ord.orderId}</span>
                      <StatusBadge status={ord.status} />
                      <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Rx: {ord.prescriptionCode}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Placed: {format(new Date(ord.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  {/* Sanitized Patient & Item Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">Patient Info (Sanitized)</span>
                      <p className="text-slate-900 font-semibold">{ord.patientName || 'Patient'}</p>
                      <p className="text-slate-600">Phone: {ord.contactNumber || ord.patientPhone || 'N/A'}</p>
                      <p className="text-slate-600">Address: {ord.deliveryAddress || 'N/A'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">Order Items</span>
                      <div className="space-y-1 pt-1">
                        {ord.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between font-medium text-slate-800">
                            <span>{item.medicineName} {item.strength}</span>
                            <span className="text-slate-500">Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <Link href={`/pharmacy/orders/${ord._id}?type=order`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5" /> Full Order Details
                      </Button>
                    </Link>

                    {ord.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'ACCEPTED')}
                      >
                        Accept Order
                      </Button>
                    )}

                    {ord.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'PROCESSING')}
                      >
                        Set to Processing
                      </Button>
                    )}

                    {ord.status === 'PROCESSING' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'READY')}
                      >
                        Set Ready for Pickup
                      </Button>
                    )}

                    {ord.status === 'READY' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateOrderStatus(ord._id, 'DISPENSED')}
                      >
                        Mark Dispensed
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
