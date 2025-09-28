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
import { type NavItem, type SharedData } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Car, Folder, Fuel, LayoutGrid, ShoppingCart, Users, Building2 } from 'lucide-react';
import AppLogo from './app-logo';
import organizations from "@/routes/organizations";
import vehicles from "@/routes/vehicles";
import fuels from "@/routes/fuels";
import orders from "@/routes/orders";
import users from "@/routes/users";
import reports from "@/routes/reports";
import { usePage } from '@inertiajs/react';
import { useCallback } from "react";

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
        icon: Building2, // add related icon
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
    const page = usePage();
    const { auth } = page.props;

    const mainNavItems = useCallback((items: NavItem[]): NavItem[] => {
        // @ts-ignore
        if (auth.user?.role === 'admin') {
            return items
        }
        
        return [
            {
                title: 'Orders',
                href: orders.index(),
                icon: ShoppingCart,
            }
        ]
    }, []);

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
