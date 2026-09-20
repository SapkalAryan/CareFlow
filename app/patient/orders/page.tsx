'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const TERMINAL_PRESCRIPTION_STATUSES = [
  'CANCELLED',
  'COMPLETED',
  'DISPENSED',
];

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'READY',
];

function PatientOrdersContent() {
  const searchParams = useSearchParams();
  const preselectedRxId = searchParams.get('prescriptionId') || '';

  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(
    Boolean(preselectedRxId)
  );

  const [selectedRxId, setSelectedRxId] = useState(preselectedRxId);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrdersAndPrescriptions();
  }, []);

  const fetchOrdersAndPrescriptions = async () => {
    setLoading(true);
    setError('');

    try {
      /*
       * We intentionally do NOT call /api/pharmacies here.
       *
       * Every prescription already contains its assigned pharmacyId.
       * The patient's order must go to that pharmacy.
       */
      const [ordRes, rxRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/prescriptions', { cache: 'no-store' }),
      ]);

      const ordData = await ordRes.json();
      const rxData = await rxRes.json();

      if (!ordRes.ok) {
        throw new Error(ordData.error || 'Failed to load orders');
      }

      if (!rxRes.ok) {
        throw new Error(rxData.error || 'Failed to load prescriptions');
      }

      const loadedOrders = Array.isArray(ordData.orders)
        ? ordData.orders
        : [];

      const loadedPrescriptions = Array.isArray(rxData.prescriptions)
        ? rxData.prescriptions
        : [];

      setOrders(loadedOrders);
      setPrescriptions(loadedPrescriptions);

      /*
       * Prefill contact/address from the prescription's populated
       * patient profile. This avoids depending on the doctor-only
       * patient endpoint.
       */
      const firstPrescription =
        loadedPrescriptions.find(
          (rx: any) => rx._id === (preselectedRxId || selectedRxId)
        ) || loadedPrescriptions[0];

      const patient = firstPrescription?.patientId;
      const patientUser = patient?.userId;

      if (patientUser?.phone) {
        setContactNumber(patientUser.phone);
      }

      if (patient?.address) {
        setDeliveryAddress(patient.address);
      }

      /*
       * Automatically select the requested prescription if it still
       * exists; otherwise select the first orderable prescription.
       */
      const activeOrderPrescriptionIds = new Set(
        loadedOrders
          .filter((order: any) =>
            ACTIVE_ORDER_STATUSES.includes(order.status)
          )
          .map((order: any) => {
            const id =
              typeof order.prescriptionId === 'object'
                ? order.prescriptionId?._id
                : order.prescriptionId;

            return id ? id.toString() : null;
          })
          .filter(Boolean)
      );

      const orderable = loadedPrescriptions.filter((rx: any) => {
        if (!rx?._id) return false;

        if (TERMINAL_PRESCRIPTION_STATUSES.includes(rx.status)) {
          return false;
        }

        return !activeOrderPrescriptionIds.has(rx._id.toString());
      });

      const requestedPrescription = orderable.find(
        (rx: any) => rx._id === preselectedRxId
      );

      if (requestedPrescription) {
        setSelectedRxId(requestedPrescription._id);
      } else if (
        selectedRxId &&
        orderable.some((rx: any) => rx._id === selectedRxId)
      ) {
        // Keep the current selection.
      } else if (orderable.length > 0) {
        setSelectedRxId(orderable[0]._id);
      } else {
        setSelectedRxId('');
      }
    } catch (err: any) {
      console.error('Error loading patient orders data:', err);
      setError(err.message || 'Failed to load order information.');
    } finally {
      setLoading(false);
    }
  };

  /*
   * An orderable prescription is:
   *
   * 1. Not cancelled/completed/dispensed
   * 2. Does not already have an active order
   */
  const activeOrderPrescriptionIds = useMemo(() => {
    return new Set(
      orders
        .filter((order: any) =>
          ACTIVE_ORDER_STATUSES.includes(order.status)
        )
        .map((order: any) => {
          const id =
            typeof order.prescriptionId === 'object'
              ? order.prescriptionId?._id
              : order.prescriptionId;

          return id ? id.toString() : null;
        })
        .filter(Boolean)
    );
  }, [orders]);

  const orderablePrescriptions = useMemo(() => {
    return prescriptions.filter((rx: any) => {
      if (!rx?._id) return false;

      if (TERMINAL_PRESCRIPTION_STATUSES.includes(rx.status)) {
        return false;
      }

      return !activeOrderPrescriptionIds.has(rx._id.toString());
    });
  }, [prescriptions, activeOrderPrescriptionIds]);

  const selectedPrescription = useMemo(() => {
    return (
      orderablePrescriptions.find(
        (rx: any) => rx._id === selectedRxId
      ) || null
    );
  }, [orderablePrescriptions, selectedRxId]);

  /*
   * The pharmacy comes directly from the prescription.
   *
   * No separate pharmacy selection is required.
   */
  const selectedPharmacy = selectedPrescription?.pharmacyId || null;

  useEffect(() => {
    if (!selectedPrescription) return;

    const patient = selectedPrescription.patientId;
    const patientUser = patient?.userId;

    if (patientUser?.phone) {
      setContactNumber(patientUser.phone);
    }

    if (patient?.address) {
      setDeliveryAddress(patient.address);
    }
  }, [selectedPrescription]);

  const handleOpenOrderModal = () => {
    setError('');
    setSuccess('');

    if (orderablePrescriptions.length > 0) {
      if (
        !selectedRxId ||
        !orderablePrescriptions.some(
          (rx: any) => rx._id === selectedRxId
        )
      ) {
        setSelectedRxId(orderablePrescriptions[0]._id);
      }
    }

    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    if (isSubmitting) return;

    setIsOrderModalOpen(false);
    setError('');
    setSuccess('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrescription) {
      setError('Please select an active prescription.');
      return;
    }

    const pharmacyId =
      typeof selectedPrescription.pharmacyId === 'object'
        ? selectedPrescription.pharmacyId?._id
        : selectedPrescription.pharmacyId;

    if (!pharmacyId) {
      setError(
        'This prescription does not have an assigned pharmacy. Please contact the doctor.'
      );
      return;
    }

    if (!contactNumber.trim()) {
      setError('Contact number is required.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Delivery / contact address is required.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId: selectedPrescription._id,
          pharmacyId,
          notes: orderNotes.trim(),
          deliveryAddress: deliveryAddress.trim(),
          contactNumber: contactNumber.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to place order.');
        return;
      }

      setSuccess(
        `Order ${json.order?.orderId || ''} placed successfully!`
      );

      /*
       * Refresh the data immediately so the prescription moves out
       * of the orderable list and the new order appears in the list.
       */
      await fetchOrdersAndPrescriptions();

      setTimeout(() => {
        setIsOrderModalOpen(false);
        setOrderNotes('');
        setSuccess('');
      }, 1000);
    } catch (err) {
      console.error('Order submission error:', err);
      setError('An error occurred while placing the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Medication Orders
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Order prescribed medications from the pharmacy assigned to
              your prescription and track fulfillment status.
            </p>
          </div>

          <Button
            variant="primary"
            className="gap-2"
            onClick={handleOpenOrderModal}
          >
            <Plus className="w-4 h-4" />
            Place New Order
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-32 w-full rounded-2xl"
                />
              ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders placed yet"
            description="Place your first order by selecting an active prescription."
            icon={ShoppingBag}
            actionLabel="Place New Order"
            onAction={handleOpenOrderModal}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((ord: any) => {
              const rx = ord.prescriptionId;
              const pharmacy = ord.pharmacyId;
              const pharmUser = pharmacy?.userId;

              return (
                <div
                  key={ord._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-slate-900">
                        {ord.orderId}
                      </span>

                      <StatusBadge status={ord.status} />
                    </div>

                    <span className="text-xs text-slate-400">
                      Order Date:{' '}
                      {format(
                        new Date(ord.createdAt),
                        'MMMM d, yyyy • h:mm a'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">
                        Rx Info & Items
                      </span>

                      <p className="text-sky-700 font-semibold">
                        Prescription Code:{' '}
                        {rx?.prescriptionId || ord.prescriptionCode || 'N/A'}
                      </p>

                      <p className="text-slate-600">
                        Items:{' '}
                        {rx?.items
                          ?.map(
                            (i: any) =>
                              `${i.medicineName} (${i.strength}) × ${i.quantity}`
                          )
                          .join(', ') ||
                          ord.items
                            ?.map(
                              (i: any) =>
                                `${i.medicineName} (${i.strength}) × ${i.quantity}`
                            )
                            .join(', ') ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700">
                        Target Pharmacy
                      </span>

                      <p className="text-slate-900 font-semibold">
                        {pharmacy?.pharmacyName ||
                          ord.pharmacyName ||
                          'Pharmacy'}
                      </p>

                      <p className="text-slate-500">
                        {pharmacy?.address ||
                          ord.pharmacyAddress ||
                          'Address not available'}
                      </p>

                      <p className="text-slate-500">
                        Contact:{' '}
                        {pharmUser?.phone ||
                          ord.pharmacyPhone ||
                          'N/A'}
                      </p>
                    </div>
                  </div>

                  {(ord.deliveryAddress || ord.contactNumber) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ord.contactNumber && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs">
                          <span className="font-bold text-blue-900">
                            Order Contact Number
                          </span>

                          <p className="text-blue-700 mt-1">
                            {ord.contactNumber}
                          </p>
                        </div>
                      )}

                      {ord.deliveryAddress && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs">
                          <span className="font-bold text-blue-900">
                            Order Address
                          </span>

                          <p className="text-blue-700 mt-1">
                            {ord.deliveryAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {ord.notes && (
                    <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      <span className="font-bold text-amber-900">
                        Order Notes:{' '}
                      </span>
                      {ord.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Place Order Modal */}
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={handleCloseOrderModal}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5 pr-8">
                <h3 className="text-xl font-bold text-slate-900">
                  Place Pharmacy Order
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Your order will be sent to the pharmacy assigned to the
                  selected prescription.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {orderablePrescriptions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    No prescriptions are currently available to order.
                  </p>

                  <p className="text-xs text-amber-700 mt-1">
                    A prescription cannot be ordered again while it already
                    has an active pharmacy order. Once an order is completed
                    or cancelled, it can become available again.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handlePlaceOrder}
                  className="space-y-4"
                >
                  {/* Prescription */}
                  <div className="space-y-1.5">
                    <Label htmlFor="rxSelect">
                      Select Prescription
                    </Label>

                    <Select
                      id="rxSelect"
                      value={selectedRxId}
                      onChange={(e) => {
                        setSelectedRxId(e.target.value);
                        setError('');
                      }}
                    >
                      {orderablePrescriptions.map((rx: any) => (
                        <option
                          key={rx._id}
                          value={rx._id}
                        >
                          {rx.prescriptionId} -{' '}
                          {rx.items
                            ?.map(
                              (i: any) => i.medicineName
                            )
                            .join(', ')}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Assigned Pharmacy */}
                  <div className="space-y-1.5">
                    <Label>Receiving Pharmacy</Label>

                    {selectedPharmacy ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedPharmacy.pharmacyName ||
                            'Assigned Pharmacy'}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {selectedPharmacy.address ||
                            'Pharmacy address not available'}
                        </p>

                        {selectedPharmacy.userId?.phone && (
                          <p className="text-xs text-slate-500 mt-1">
                            Contact:{' '}
                            {selectedPharmacy.userId.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-xs text-rose-700">
                          This prescription does not have an assigned
                          pharmacy.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactNumber">
                      Contact Number *
                    </Label>

                    <Input
                      id="contactNumber"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) =>
                        setContactNumber(e.target.value)
                      }
                      placeholder="Patient contact number"
                      required
                    />

                    <p className="text-[11px] text-slate-400">
                      Pre-filled from your patient profile. You can
                      update it for this order.
                    </p>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryAddress">
                      Delivery / Contact Address *
                    </Label>

                    <Input
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) =>
                        setDeliveryAddress(e.target.value)
                      }
                      placeholder="Enter the address for this order"
                      required
                    />

                    <p className="text-[11px] text-slate-400">
                      Pre-filled from your patient profile.
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">
                      Fulfillment / Delivery Notes (Optional)
                    </Label>

                    <Input
                      id="notes"
                      placeholder="e.g. Please call before delivery"
                      value={orderNotes}
                      onChange={(e) =>
                        setOrderNotes(e.target.value)
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseOrderModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      disabled={
                        !selectedPrescription ||
                        !selectedPharmacy ||
                        !contactNumber.trim() ||
                        !deliveryAddress.trim()
                      }
                    >
                      Confirm & Place Order
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <PatientOrdersContent />
    </Suspense>
  );
}