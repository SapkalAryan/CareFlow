import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-sky-600',
  bgColor = 'bg-sky-50',
}: StatCardProps) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-slate-200/80 rounded-3xl bg-white/95">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            {description && <p className="text-xs text-slate-500 font-medium pt-0.5">{description}</p>}
          </div>
          <div className={`p-3.5 rounded-2xl ${bgColor} shadow-xs shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
