import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const subscriptionPaymentDue =
        usePage().props.subscriptionPaymentDue === true;
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {subscriptionPaymentDue && (
                <Link
                    href="/subscription-payments/pay"
                    className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-amber-500 bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-amber-300 dark:bg-amber-300 dark:hover:bg-amber-200"
                >
                    <CircleAlert className="size-4" aria-hidden="true" />
                    Payment Due
                </Link>
            )}
        </header>
    );
}
