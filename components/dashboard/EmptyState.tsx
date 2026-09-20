import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-3xl border border-dashed border-slate-300 bg-white/80 backdrop-blur-sm shadow-xs space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 border border-sky-100 shadow-xs">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" className="mt-2 font-bold rounded-xl shadow-md shadow-sky-500/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
