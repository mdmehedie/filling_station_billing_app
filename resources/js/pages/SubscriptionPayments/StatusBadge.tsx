import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Payment } from './types';

const styles = {
    pending:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    approved:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    rejected:
        'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
};

const icons = {
    pending: Clock3,
    approved: CheckCircle2,
    rejected: XCircle,
};

export function StatusBadge({ status }: { status: Payment['status'] }) {
    const Icon = icons[status];

    return (
        <Badge
            variant="outline"
            className={`gap-1.5 capitalize ${styles[status]}`}
        >
            <Icon className="size-3.5" />
            {status}
        </Badge>
    );
}
