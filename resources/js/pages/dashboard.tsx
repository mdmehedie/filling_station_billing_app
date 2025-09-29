import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Car,
    Building2,
    Fuel,
    TrendingUp,
    Calendar,
    Activity, SchoolIcon
} from 'lucide-react';
import ordersRoute from '@/routes/orders';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    statistics: {
        totalVehicles: number;
        totalOrganizations: number;
        totalOrders: number;
        totalFuelTypes: number;
        totalOrderQuantity: number;
        totalSalesAmount: number;
        thisMonthFuelQty: number;
        thisMonthTotalPrice: number
    };
    recentOrders: any[];
    vehiclesByType: Record<string, number>;
    ordersByMonth: any[];
    dailySales: any[];
    topOrganizations: any[];
    fuelConsumption: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({
    statistics,
    recentOrders,
    vehiclesByType,
    ordersByMonth,
    dailySales,
    topOrganizations,
    fuelConsumption
}: Props) {

    console.log(dailySales);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                Fuel orders placed
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Order Quantity</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalOrderQuantity} (L)</div>
                            <p className="text-xs text-muted-foreground">
                                Total order quantity
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalVehicles}</div>
                            <p className="text-xs text-muted-foreground">
                                Registered vehicles
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalOrganizations}</div>
                            <p className="text-xs text-muted-foreground">
                                Active organizations
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sales Analytics - Area Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Daily Sales Analytics
                                </CardTitle>
                                <CardDescription>
                                    Sales quantity and amount over the last 30 days
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                    ৳{statistics.thisMonthFuelQty} (L)
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total Sold Fuel
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    ৳{statistics.thisMonthTotalPrice}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total Sales Amount
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={dailySales}
                                    margin={{
                                        top: 10,
                                        right: 30,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            const day = date.getDate();
                                            const month = date.toLocaleDateString('en-GB', { month: 'short' });

                                            // Add ordinal suffix to day
                                            const getOrdinalSuffix = (day: number) => {
                                                if (day >= 11 && day <= 13) return 'th';
                                                switch (day % 10) {
                                                    case 1: return 'st';
                                                    case 2: return 'nd';
                                                    case 3: return 'rd';
                                                    default: return 'th';
                                                }
                                            };

                                            return `${day}${getOrdinalSuffix(day)} ${month}`;
                                        }}
                                    />
                                    <YAxis yAxisId="left" orientation="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length && label) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-md">
                                                        <p className="font-medium">{new Date(label).toLocaleDateString('en-GB', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}</p>
                                                        <div className="mt-2 space-y-1">
                                                            <p className="text-sm">
                                                                <span className="font-medium text-blue-600">Quantity:</span> {payload[0]?.value || 0}L
                                                            </p>
                                                            <p className="text-sm">
                                                                <span className="font-medium text-green-600">Amount:</span> ৳{(payload[1]?.value || 0).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="total_quantity"
                                        stackId="1"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.3}
                                        name="Quantity (L)"
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="total_amount"
                                        stackId="2"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.3}
                                        name="Amount (৳)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts and Analytics */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* use chart */}

                </div>

                {/* Recent Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Orders
                        </CardTitle>
                        <CardDescription>
                            Latest fuel orders
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    {/* Organization */}
                                    <div className="flex items-center gap-4 w-1/3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            <SchoolIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {order.organization?.name || `Vehicle #${order.vehicle_id}`}{" "}
                                                ({order.organization?.ucode})
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {order.organization?.name_bn}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle */}
                                    <div className="flex items-center gap-4 w-1/3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            <Car className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {order.vehicle?.name || `Vehicle #${order.vehicle_id}`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {order.vehicle?.ucode} • {order.fuel?.name}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity + Total */}
                                    <div className="flex items-center gap-10 w-1/3 justify-end">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{order.fuel_qty}L</div>
                                            <div className="text-xs text-muted-foreground">Quantity</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">৳{order.total_price}</div>
                                            <div className="text-xs text-muted-foreground">Total</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    {/* <Button asChild>
                        <a href={vehiclesRoute.dashboard?.()?.url || '/vehicles/dashboard'}>
                            Vehicle Dashboard
                        </a>
                    </Button> */}
                    <Button variant="outline" asChild>
                        <a href={ordersRoute.index().url}>
                            View All Orders
                        </a>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
