import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Status } from '../domain/types';

interface Props {
  status: Status;
  label?: string;
}

const LABELS: Record<Status, string> = {
  ok: 'Nominal',
  warn: 'Monitor',
  alert: 'Alert',
};

export function StatusBadge({ status, label }: Props) {
  const Icon =
    status === 'ok'
      ? CheckCircle2
      : status === 'warn'
        ? AlertTriangle
        : AlertOctagon;
  return (
    <span className={`badge badge-${status}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{label ?? LABELS[status]}</span>
    </span>
  );
}
