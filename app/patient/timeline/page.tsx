'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TimelineFeed } from '@/components/dashboard/TimelineFeed';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

export default function PatientTimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Medical Timeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chronological audit history of all your healthcare consultations, prescriptions, orders, and refill requests.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No medical timeline events logged"
            description="Your healthcare journey events (prescriptions, orders, refills) will be recorded here chronologically."
            icon={Clock}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <TimelineFeed events={events} />
          </div>
        )}
      </div>
    </div>
  );
}
