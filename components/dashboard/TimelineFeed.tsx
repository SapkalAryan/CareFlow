import React from 'react';
import { format } from 'date-fns';
import {
  Stethoscope,
  FileText,
  ShoppingBag,
  CheckCircle2,
  Clock,
  PackageCheck,
  Pill,
  RefreshCw,
  Calendar,
  Activity,
} from 'lucide-react';

interface TimelineEventItem {
  _id: string;
  eventType: string;
  description: string;
  createdAt: string | Date;
}

interface TimelineFeedProps {
  events: TimelineEventItem[];
}

export function TimelineFeed({ events }: TimelineFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-semibold">
        No medical timeline events recorded yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-sky-600" />;
      case 'PRESCRIPTION_CREATED':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'ORDER_PLACED':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'PHARMACY_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'PROCESSING':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'READY_FOR_PICKUP':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case 'DISPENSED':
        return <Pill className="w-4 h-4 text-teal-600" />;
      case 'REFILL_REQUESTED':
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case 'REFILL_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'FOLLOW_UP':
        return <Calendar className="w-4 h-4 text-sky-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-sky-300 before:via-indigo-200 before:to-slate-200">
      {events.map((event) => (
        <div key={event._id} className="relative group">
          <div className="absolute -left-8 top-1.5 p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
            {getEventIcon(event.eventType)}
          </div>
          <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {event.eventType.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {format(new Date(event.createdAt), 'MMM d, yyyy • h:mm a')}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
