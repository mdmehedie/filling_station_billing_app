import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Car, 
    Building2, 
    Fuel, 
    TrendingUp, 
    Users, 
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Vehicle, Organization } from "@/types/response";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import vehiclesRoute from "@/routes/vehicles";

interface VehicleOrder {
    vehicle_id: number;
    order_count: number;
    total_fuel_qty: number;
    total_spent: number;
    vehicle?: Vehicle;
}

interface VehicleByFuel {
    fuel_name: string;
    fuel_type: string;
    count: number;
}

interface Props {
    statistics: {
        totalVehicles: number;
    };
    vehiclesByType: Record<string, number>;
    vehiclesByFuel: VehicleByFuel[];
    vehiclesByOrganization: Organization[];
    recentVehicles: Vehicle[];
    vehicleOrders: VehicleOrder[];
}

export default function VehicleDashboard({ 
    statistics, 
    vehiclesByType, 
    vehiclesByFuel, 
    vehiclesByOrganization, 
    recentVehicles, 
    vehicleOrders 
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Vehicles Dashboard',
            href: vehiclesRoute.dashboard().url,
        },
    ];

    const totalVehicles = statistics.totalVehicles;
    const totalOrganizations = vehiclesByOrganization.length;
    const totalOrders = vehicleOrders.reduce((sum, order) => sum + order.order_count, 0);
    const totalFuelConsumption = vehicleOrders.reduce((sum, order) => sum + order.total_fuel_qty, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalVehicles}</div>
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
                            <div className="text-2xl font-bold">{totalOrganizations}</div>
                            <p className="text-xs text-muted-foreground">
                                Active organizations
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                Fuel orders placed
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fuel Consumed</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalFuelConsumption.toFixed(2)}L</div>
                            <p className="text-xs text-muted-foreground">
                                Total fuel consumed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Analytics */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Vehicles by Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Vehicles by Type
                            </CardTitle>
                            <CardDescription>
                                Distribution of vehicles by type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(vehiclesByType).map(([type, count]) => {
                                    const percentage = totalVehicles > 0 ? (count / totalVehicles) * 100 : 0;
                                    return (
                                        <div key={type} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{type || 'Unspecified'}</span>
                                                <span className="text-sm text-muted-foreground">{count}</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicles by Fuel Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Vehicles by Fuel Type
                            </CardTitle>
                            <CardDescription>
                                Distribution of vehicles by fuel type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {vehiclesByFuel.map((fuel) => {
                                    const percentage = totalVehicles > 0 ? (fuel.count / totalVehicles) * 100 : 0;
                                    return (
                                        <div key={fuel.fuel_name} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium">{fuel.fuel_name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">({fuel.fuel_type})</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">{fuel.count}</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Organizations and Recent Vehicles */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Organizations by Vehicle Count */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Top Organizations
                            </CardTitle>
                            <CardDescription>
                                Organizations with most vehicles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {vehiclesByOrganization.slice(0, 5).map((org, index) => (
                                    <div key={org.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{org.name}</div>
                                                <div className="text-sm text-muted-foreground">{org.name_bn}</div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">
                                            {org.vehicles_count} vehicles
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Vehicles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Vehicles
                            </CardTitle>
                            <CardDescription>
                                Latest registered vehicles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentVehicles.slice(0, 5).map((vehicle) => (
                                    <div key={vehicle.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{vehicle.name || 'Unnamed Vehicle'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {vehicle.ucode} • {vehicle.fuel.name}
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {vehicle.type || 'Unspecified'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Vehicle Orders Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Vehicle Orders Statistics
                        </CardTitle>
                        <CardDescription>
                            Top vehicles by order count and fuel consumption
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {vehicleOrders.slice(0, 10).map((order, index) => (
                                <div key={order.vehicle_id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {order.vehicle?.name || `Vehicle #${order.vehicle_id}`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {order.vehicle?.ucode} • {order.vehicle?.fuel.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-sm font-medium">{order.order_count}</div>
                                            <div className="text-xs text-muted-foreground">Orders</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-medium">{order.total_fuel_qty.toFixed(2)}L</div>
                                            <div className="text-xs text-muted-foreground">Fuel</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-medium">${order.total_spent.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground">Spent</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button asChild>
                        <a href={vehiclesRoute.index().url}>
                            View All Vehicles
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={dashboard().url}>
                            Back to Main Dashboard
                        </a>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
