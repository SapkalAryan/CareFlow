'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, CheckCircle2, AlertCircle, Plus, Trash2, ShieldAlert, ArrowLeft, Send } from 'lucide-react';
import { calculatePrescriptionQuantity } from '@/lib/prescriptionQuantity';

export const dynamic = 'force-dynamic';

function NewPrescriptionContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [naturalText, setNaturalText] = useState('');

  // AI & Form state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStructured, setAiStructured] = useState(false);
  const [aiWarning, setAiWarning] = useState('');

  // Structured Medication items
  const [items, setItems] = useState<any[]>([
    {
      medicineName: '',
      strength: '',
      dosage: '1 tablet',
      frequency: 'Once daily',
      timing: 'After meals',
      duration: '30 days',
      quantity: 30,
      instructions: '',
    },
  ]);

  const [followUpDate, setFollowUpDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [patRes, pharmRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/pharmacies'),
      ]);
      const patData = await patRes.json();
      const pharmData = await pharmRes.json();

      const patList = patData.patients || [];
      const pharmList = pharmData.pharmacies || [];

      setPatients(patList);
      setPharmacies(pharmList);

      if (patList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patList[0]._id);
      }
      if (pharmList.length > 0) {
        setSelectedPharmacyId(pharmList[0]._id);
      }
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const handleAiStructure = async () => {
    if (!naturalText || naturalText.trim().length < 5) {
      setError('Please enter natural language instructions before structuring with AI.');
      return;
    }

    setError('');
    setAiWarning('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/structure-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguage: naturalText }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'AI structuring failed');
        setIsAiLoading(false);
        return;
      }

      const data = json.data;

      const aiItem = {
        medicineName: data.medicine || '',
        strength: data.strength || '',
        dosage: data.dosage || '1 tablet',
        frequency: data.frequency || 'Once daily',
        timing: data.timing || 'After breakfast',
        duration: data.duration || '30 days',
        quantity: calculatePrescriptionQuantity(
          data.dosage || '1 tablet',
          data.frequency || 'Once daily',
          data.duration || '30 days'
        ) ?? (Number(data.quantity) > 0 ? Number(data.quantity) : 0),
        instructions: data.instructions || naturalText,
      };

      // IMPORTANT: AI never replaces the whole prescription. It fills the first
      // genuinely empty medication row; if none exists, it creates a new row.
      // This lets the doctor add Medicine 1, Medicine 2, Medicine 3, etc. safely.
      setItems((currentItems) => {
        const emptyIndex = currentItems.findIndex(isMedicationEmpty);

        if (emptyIndex === -1) {
          return [...currentItems, aiItem];
        }

        return currentItems.map((item, index) =>
          index === emptyIndex ? aiItem : item
        );
      });

      setAiStructured(true);

      if (data.requiresClarification) {
        setAiWarning('Note: AI flagged potential ambiguity in instructions. Please review every field carefully before confirming.');
      }
    } catch (err) {
      setError('An unexpected error occurred during AI processing.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const createEmptyMedication = () => ({
    medicineName: '',
    strength: '',
    dosage: '1 tablet',
    frequency: 'Once daily',
    timing: 'After meals',
    duration: '7 days',
    quantity: 10,
    instructions: '',
  });

  const isMedicationEmpty = (item: any) =>
    !item.medicineName?.trim() && !item.strength?.trim();

  const addItem = () => {
    // Use a functional update so two rapid clicks never reuse a stale `items` array.
    setItems((currentItems) => [...currentItems, createEmptyMedication()]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updatedItem = { ...item, [field]: value };

        if (field === 'dosage' || field === 'frequency' || field === 'duration') {
          const calculated = calculatePrescriptionQuantity(
            updatedItem.dosage,
            updatedItem.frequency,
            updatedItem.duration
          );
          if (calculated !== null) {
            updatedItem.quantity = calculated;
          }
        }

        return updatedItem;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPatientId) {
      setError('Please select a patient');
      return;
    }

    if (!selectedPharmacyId) {
      setError('Please select a receiving pharmacy');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].medicineName || !items[i].strength) {
        setError(`Please fill in medicine name and strength for Item #${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          pharmacyId: selectedPharmacyId,
          items,
          followUpDate: followUpDate || undefined,
          additionalNotes,
          aiStructured,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to issue prescription');
        setIsSubmitting(false);
        return;
      }

      setSuccess(`Prescription ${json.prescription.prescriptionId} issued and sent to pharmacy successfully!`);
      setTimeout(() => {
        router.push(`/doctor/patients/${selectedPatientId}`);
      }, 1500);
    } catch (err) {
      setError('An unexpected error occurred while saving the prescription.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Issue New Prescription</h1>
            <p className="text-xs text-slate-500 mt-1">
              AI-Assisted prescription structuring with mandatory doctor review and confirmation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Pharmacy Selection Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                1. Select Patient & Receiving Pharmacy
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="patientSelect">Select Patient</Label>
                {patients.length === 0 ? (
                  <p className="text-xs text-rose-600">No patients registered. Please register a patient first.</p>
                ) : (
                  <Select
                    id="patientSelect"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.userId?.fullName} ({p.userId?.phone})
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pharmacySelect">Assigned Receiving Pharmacy</Label>
                {pharmacies.length === 0 ? (
                  <p className="text-xs text-rose-600">No pharmacies registered yet.</p>
                ) : (
                  <Select
                    id="pharmacySelect"
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  >
                    {pharmacies.map((ph) => (
                      <option key={ph._id} value={ph._id}>
                        {ph.pharmacyName} ({ph.address})
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Structuring Assistant Card */}
          <Card className="border-sky-200 bg-sky-50/30 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    2. AI Prescription Assistant (GPT-4o-mini)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Type free-text instructions below. AI will extract structured medication fields for your review.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder='e.g., "Give the patient amlodipine 5 mg once daily after breakfast for 30 days"'
                rows={3}
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                className="bg-white"
              />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAiStructure}
                  isLoading={isAiLoading}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  Structure with AI
                </Button>

                {aiStructured && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AI Extraction Complete
                  </span>
                )}
              </div>

              {aiWarning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  {aiWarning}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Medications Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  3. Medication Items (Doctor Confirmation Required)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Review and edit the extracted medication details below.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Medication
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Medication #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Medicine Name</Label>
                      <Input
                        placeholder="e.g. Amlodipine"
                        value={item.medicineName}
                        onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Strength</Label>
                      <Input
                        placeholder="e.g. 5 mg"
                        value={item.strength}
                        onChange={(e) => updateItem(index, 'strength', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Dosage</Label>
                      <Input
                        placeholder="1 tablet"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <Input
                        placeholder="Once daily"
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Timing</Label>
                      <Input
                        placeholder="After breakfast"
                        value={item.timing}
                        onChange={(e) => updateItem(index, 'timing', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration & Qty</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          placeholder="30 days"
                          value={item.duration}
                          onChange={(e) => updateItem(index, 'duration', e.target.value)}
                          required
                        />
                        <Input
                          type="number"
                          placeholder="30"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="followUpDate">Follow-up Consultation Date (Optional)</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="additionalNotes">Clinical Notes for Pharmacy / Patient</Label>
                  <Input
                    id="additionalNotes"
                    placeholder="Take with plenty of water"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-200 p-4 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Rule 4 Safety: Doctor confirmation required before saving & sending to pharmacy.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="gap-2 px-8 font-bold"
              >
                <Send className="w-4 h-4" /> Confirm & Send Prescription
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
      <NewPrescriptionContent />
    </Suspense>
  );
}

