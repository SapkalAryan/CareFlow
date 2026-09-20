'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartPulse, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      // Fetch session to determine role and redirect
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const role = session?.user?.role || 'doctor';

      router.push(`/${role}/dashboard`);
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200/80 backdrop-blur-md bg-white/95 rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 h-2.5 w-full" />
        
        <CardHeader className="text-center space-y-3 pt-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign in to <span className="text-sky-600">CareFlow</span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 font-medium">
              Access Doctor, Patient, or Pharmacy Portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-medium shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-base font-bold shadow-md shadow-sky-500/20 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800"
              isLoading={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 p-4">
          <p className="text-xs text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <Link href="/register" className="font-bold text-sky-600 hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
