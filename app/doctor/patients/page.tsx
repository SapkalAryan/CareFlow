'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Users, Search, UserPlus, FilePlus, ChevronRight, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Patient Registration
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to register patient');
        setIsSubmitting(false);
        return;
      }

      setFormSuccess('Patient created and linked successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          dateOfBirth: '',
          gender: 'Male',
          bloodGroup: 'O+',
          address: '',
          emergencyContact: '',
        });
        fetchPatients();
      }, 1000);
    } catch (err: any) {
      setFormError('An unexpected error occurred.');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Patient Directory</h1>
            <p className="text-sm text-slate-500 mt-1">
              Search, manage, and add registered patients linked to your practice.
            </p>
          </div>
          <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Add New Patient
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by patient name, phone number, or ID..."
              className="pl-9 bg-slate-50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Patients Grid / Table */}
        {loading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patients found"
            description={
              search
                ? `No records matching "${search}". Try another search query.`
                : 'No patients registered yet. Add your first patient to begin clinical care.'
            }
            icon={Users}
            actionLabel="Add Patient Now"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Date of Birth</th>
                    <th className="px-6 py-4">Blood Group</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {patients.map((patient) => {
                    const user = patient.userId;
                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{user?.fullName || 'N/A'}</div>
                          <div className="text-xs text-slate-400 font-normal">{user?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user?.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600">{patient.dateOfBirth}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200">
                            {patient.bloodGroup}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link href={`/doctor/patients/${patient._id}`}>
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              View Profile <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/doctor/prescriptions/new?patientId=${patient._id}`}>
                            <Button size="sm" variant="primary" className="text-xs gap-1">
                              <FilePlus className="w-3.5 h-3.5" /> Prescribe
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Patient Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 relative my-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Register New Patient</h3>
                <p className="text-xs text-slate-500">
                  Creates a patient account linked to your medical practice.
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      id="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Residential Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Oak St, Suite 4"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="+1 (555) 999-0000"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Save Patient
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
