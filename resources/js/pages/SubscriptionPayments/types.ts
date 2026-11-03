export interface Payment {
    id: number;
    user?: { id: number; name: string; email: string; phone: string };
    plan_name: string;
    duration_months: number;
    amount: string;
    payment_method: string;
    transaction_id: string;
    coverage_start: string;
    coverage_end: string;
    submitted_at: string;
    approved_at: string | null;
    rejected_at: string | null;
    status: 'pending' | 'approved' | 'rejected';
    invoice_number: string | null;
    receipt_number: string | null;
    rejection_reason: string | null;
    approver?: { name: string };
}
export interface Subscription {
    state: string;
    coverage_start: string | null;
    coverage_end: string | null;
    covered_until: string | null;
    next_unpaid_month: string;
    payment_due: boolean;
    pending_payment: Payment | null;
}
export const date = (value: string | null) =>
    value
        ? new Date(value).toLocaleDateString('en-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '—';
export const money = (value: string | number) =>
    `BDT ${Number(value).toLocaleString('en-BD')}`;
