import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { Check, LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Payment } from './types';

export function PaymentReviewActions({
    payment,
    compact = false,
}: {
    payment: Payment;
    compact?: boolean;
}) {
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const reference = `SP-${String(payment.id).padStart(6, '0')}`;

    const approve = () => {
        setError('');
        router.post(
            `/admin/subscription-payments/${payment.id}/approve`,
            {},
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setApproving(false),
                onError: (errors) =>
                    setError(errors.payment || 'Approval failed.'),
            },
        );
    };

    const reject = () => {
        setError('');
        router.post(
            `/admin/subscription-payments/${payment.id}/reject`,
            { rejection_reason: reason },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setRejecting(false);
                    setReason('');
                },
                onError: (errors) =>
                    setError(
                        errors.rejection_reason ||
                            errors.payment ||
                            'Rejection failed.',
                    ),
            },
        );
    };

    return (
        <>
            <div
                className={
                    compact
                        ? 'flex items-center gap-1.5'
                        : 'grid gap-2 sm:grid-cols-2'
                }
            >
                <Button
                    type="button"
                    size={compact ? 'sm' : 'lg'}
                    variant="black"
                    className={compact ? 'h-8' : 'w-full'}
                    onClick={() => {
                        setError('');
                        setApproving(true);
                    }}
                >
                    <Check className="size-4" />
                    Approve
                </Button>
                <Button
                    type="button"
                    size={compact ? 'sm' : 'lg'}
                    variant="outline"
                    className={
                        compact ? 'h-8 text-rose-700' : 'w-full text-rose-700'
                    }
                    onClick={() => {
                        setError('');
                        setRejecting(true);
                    }}
                >
                    <X className="size-4" />
                    Reject
                </Button>
            </div>

            <AlertDialog open={approving} onOpenChange={setApproving}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Approve this payment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Verify the bKash TrxID for {reference} before
                            approving. Approval activates the subscription
                            coverage and makes the invoice and money receipt
                            available.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={processing}
                            onClick={(event) => {
                                event.preventDefault();
                                approve();
                            }}
                        >
                            {processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Approve payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={rejecting} onOpenChange={setRejecting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject this payment?</DialogTitle>
                        <DialogDescription>
                            {reference} will remain in the audit history. The
                            payer can submit a new request for the same unpaid
                            month.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor={`rejection-reason-${payment.id}`}>
                            Reason (optional)
                        </Label>
                        <Textarea
                            id={`rejection-reason-${payment.id}`}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            maxLength={1000}
                            placeholder="Add a note for the payer"
                        />
                        {error && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setRejecting(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={processing}
                            onClick={reject}
                        >
                            {processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Reject payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
