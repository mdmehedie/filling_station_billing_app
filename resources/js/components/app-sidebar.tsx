import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import bankAccounts from '@/routes/bank-accounts';
import fuels from '@/routes/fuels';
import invoices from '@/routes/invoices';
import orders from '@/routes/orders';
import organizations from '@/routes/organizations';
import users from '@/routes/users';
import vehicles from '@/routes/vehicles';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Car,
    CreditCard,
    File,
    Fuel,
    LayoutGrid,
    SchoolIcon,
    ShoppingCart,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItemsBase: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Fuels',
        href: fuels.index(),
        icon: Fuel,
    },
    {
        title: 'Vehicles',
        href: vehicles.index(),
        icon: Car,
    },
    {
        title: 'Organizations',
        href: organizations.index(),
        icon: SchoolIcon,
    },
    {
        title: 'Orders',
        href: orders.index(),
        icon: ShoppingCart,
    },
    {
        title: 'Users',
        href: users.index(),
        icon: Users,
    },
    {
        title: 'Invoices',
        href: invoices.index(),
        icon: File,
    },
    {
        title: 'Bank Information',
        href: bankAccounts.index(),
        icon: Wallet,
    },
];

// if user is admin, show reports

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    const mainNavItems = (items: NavItem[]): NavItem[] => {
        if (auth.user?.role === 'superadmin') {
            return [
                ...items,
                {
                    title: 'Subscription Payments',
                    href: '/admin/subscription-payments',
                    icon: CreditCard,
                },
            ];
        }

        if (auth.user?.role === 'admin') {
            return [
                ...items,
                {
                    title: 'Payments',
                    href: '/subscription-payments',
                    icon: CreditCard,
                },
            ];
        }

        return [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Orders',
                href: orders.index(),
                icon: ShoppingCart,
            },
            {
                title: 'Vehicles',
                href: vehicles.index(),
                icon: Car,
            },
        ];
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems(mainNavItemsBase)} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
