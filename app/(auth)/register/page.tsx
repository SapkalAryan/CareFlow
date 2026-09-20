'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { HeartPulse, UserPlus, AlertCircle, CheckCircle2, Stethoscope, User, Store } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<'doctor' | 'patient' | 'pharmacy'>('doctor');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialization: 'General Medicine',
    licenseNumber: '',
    pharmacyName: '',
    address: '',
    dateOfBirth: '1995-05-15',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContact: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client side validation
    if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError('An unexpected error occurred. Please check your network or try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="shadow-xl border-slate-200/80 backdrop-blur-md bg-white/95 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 h-2.5 w-full" />

          <CardHeader className="text-center space-y-3 pt-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
                Create <span className="text-sky-600">CareFlow</span> Account
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 font-medium">
                Register as a Doctor, Patient, or Pharmacy
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 sm:px-10 pb-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-medium shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-medium shadow-xs">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection Tabs */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Account Type
                </Label>
                <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      role === 'doctor'
                        ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    Doctor
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      role === 'patient'
                        ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    Patient
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('pharmacy')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      role === 'pharmacy'
                        ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-600" />
                    Pharmacy
                  </button>
                </div>
              </div>

              {/* Base User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="e.g. Dr. Jane Smith"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Doctor Specific Fields */}
              {role === 'doctor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-sky-50/70 border border-sky-100 shadow-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      placeholder="e.g. Cardiology, General Medicine"
                      value={formData.specialization}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber">Medical License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      placeholder="MD-987654"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Pharmacy Specific Fields */}
              {role === 'pharmacy' && (
                <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pharmacyName">Pharmacy Business Name</Label>
                      <Input
                        id="pharmacyName"
                        name="pharmacyName"
                        placeholder="CareRx Pharmacy"
                        value={formData.pharmacyName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="licenseNumber">Pharmacy License No.</Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        placeholder="PH-123456"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Pharmacy Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Health Ave, Medical District"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Patient Specific Fields */}
              {role === 'patient' && (
                <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">Gender</Label>
                      <Select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
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
                        name="address"
                        placeholder="456 Maple St, Apt 2B"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emergencyContact">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyContact"
                        name="emergencyContact"
                        placeholder="+1 (555) 999-8888"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base font-bold shadow-md shadow-sky-500/20 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800"
                isLoading={isLoading}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Complete Registration
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs text-slate-500 font-medium">
              Already registered?{' '}
              <Link href="/login" className="font-bold text-sky-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
