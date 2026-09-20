import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' = 'default';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'CREATED':
    case 'PENDING':
      variant = 'info';
      break;
    case 'SENT_TO_PHARMACY':
    case 'ACCEPTED':
    case 'PROCESSING':
      variant = 'warning';
      break;
    case 'READY':
    case 'READY_FOR_PICKUP':
      variant = 'secondary';
      break;
    case 'DISPENSED':
    case 'COMPLETED':
    case 'APPROVED':
      variant = 'success';
      break;
    case 'CANCELLED':
    case 'REJECTED':
      variant = 'danger';
      break;
    case 'PARTIALLY_AVAILABLE':
    case 'PARTIALLY_DISPENSED':
    case 'CONSULTATION_REQUESTED':
      variant = 'warning';
      break;
    default:
      variant = 'default';
  }

  return <Badge variant={variant}>{label}</Badge>;
}
