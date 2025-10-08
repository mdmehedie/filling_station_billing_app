import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Car, Fuel, Calendar, Save, ArrowLeft, Search, Plus, Trash2 } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import ordersRoute from "@/routes/orders";
import { useState, useEffect, useRef, useCallback } from "react";
import { getAllVehicles } from "@/lib/api";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization } from "@/types/response";
import { Vehicle } from "@/types/response";
import { Fuel as FuelType } from "@/types/response";
interface FormData {
    organization_id: string;
    sold_date: string;
}

interface OrderItem {
    id: string;
    vehicle_id: string;
    fuel_id: string;
    fuel_qty: string;
    total_price: number;
    per_ltr_price: number;
}

interface Props {
    organizations: Organization[];
    fuels: FuelType[];
}

export default function Create({ organizations, fuels }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<FormData & { order_items: OrderItem[] }>({
        organization_id: '',
        sold_date: new Date().toISOString().split('T')[0],
        order_items: []
    });

    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    const [totalOrderAmount, setTotalOrderAmount] = useState<number>(0);
    const [vehicleSearchTerms, setVehicleSearchTerms] = useState<{ [key: string]: string }>({});
    const [isValid, setIsValid] = useState<boolean>(false);
    const [usedVehicles, setUsedVehicles] = useState<Set<number>>(new Set());
    const searchInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<{ [key: string]: number }>({});
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

    // Calculate total order amount when order items change
    useEffect(() => {
        const total = orderItems.reduce((sum, item) => sum + item.total_price, 0);
        setTotalOrderAmount(total);
        setData('order_items', orderItems);
        
        // Update used vehicles set
        const usedVehicleIds = new Set(
            orderItems
                .filter(item => item.vehicle_id)
                .map(item => parseInt(item.vehicle_id))
        );
        setUsedVehicles(usedVehicleIds);
        
        // Validate all items
        const allItemsValid = orderItems.every(item => 
            item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0
        );
        setIsValid(allItemsValid && orderItems.length > 0 && !!data.organization_id);
    }, [orderItems, setData, data.organization_id]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setData(field, value);
    };

    // Stable search handler to prevent re-renders
    const handleSearchChange = useCallback((itemId: string, value: string) => {
        setVehicleSearchTerms(prev => ({ ...prev, [itemId]: value }));
        
        // Reset selected index when search term changes
        setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: 0 }));
        
        // Maintain focus even when input becomes empty
        setTimeout(() => {
            const input = searchInputRefs.current[itemId];
            if (input && document.contains(input) && input.offsetParent !== null) {
                input.focus();
            }
        }, 0);
    }, []);

    // Focus next field after vehicle selection
    const focusNextField = useCallback((itemId: string) => {
        // Find the current item index
        const currentItemIndex = orderItems.findIndex(item => item.id === itemId);
        if (currentItemIndex === -1) return;
        
        // Find the fuel select trigger for this item
        const fuelSelectTrigger = document.querySelector(`[data-item-id="${itemId}"] [data-fuel-select]`);
        if (fuelSelectTrigger) {
            setTimeout(() => {
                (fuelSelectTrigger as HTMLElement)?.focus();
            }, 100);
        }
    }, [orderItems]);

    // Focus quantity field after fuel selection
    const focusQuantityField = useCallback((itemId: string) => {
        const quantityInput = document.querySelector(`[data-item-id="${itemId}"] [data-quantity-input]`);
        if (quantityInput) {
            setTimeout(() => {
                (quantityInput as HTMLElement)?.focus();
            }, 100);
        }
    }, []);

    // Add new vehicle and focus its search input
    const addVehicleAndFocus = useCallback(() => {
        if (!data.organization_id) return;
        
        const newItem: OrderItem = {
            id: Date.now().toString(),
            vehicle_id: '',
            fuel_id: '',
            fuel_qty: '',
            total_price: 0,
            per_ltr_price: 0
        };
        
        setOrderItems(prev => [...prev, newItem]);
        
        // Open the vehicle dropdown and focus search input
        setTimeout(() => {
            setOpenDropdowns(prev => ({ ...prev, [newItem.id]: true }));
            // Wait for the DOM to update with the new item
            setTimeout(() => {
                const searchInput = searchInputRefs.current[newItem.id];
                if (searchInput) {
                    searchInput.focus();
                }
            }, 300);
        }, 100);
    }, [data.organization_id]);

    // Handle keyboard navigation for vehicle selection
    const handleVehicleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string, filteredVehicles: Vehicle[]) => {
        const currentIndex = selectedVehicleIndex[itemId] || 0;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = Math.min(currentIndex + 1, filteredVehicles.length - 1);
            setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: nextIndex }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = Math.max(currentIndex - 1, 0);
            setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: prevIndex }));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredVehicles.length > 0 && currentIndex < filteredVehicles.length) {
                const selectedVehicle = filteredVehicles[currentIndex];
                // Call updateOrderItem directly since it's defined later
                setOrderItems(prev => prev.map(item => {
                    if (item.id === itemId) {
                        const updatedItem = { ...item, vehicle_id: selectedVehicle.id.toString() };
                        
                        // Auto-select the associated fuel for the vehicle
                        if (selectedVehicle.fuel_id) {
                            updatedItem.fuel_id = selectedVehicle.fuel_id.toString();
                            updatedItem.per_ltr_price = selectedVehicle.fuel ? selectedVehicle.fuel.price : 0;
                        }
                        
                        return updatedItem;
                    }
                    return item;
                }));
                
                // Close the dropdown after selection
                setOpenDropdowns(prev => ({ ...prev, [itemId]: false }));
                
                // Focus the next field (fuel select)
                focusNextField(itemId);
            }
        }
    }, [selectedVehicleIndex, focusNextField]);

    // Maintain focus on search input
    useEffect(() => {
        const maintainFocus = () => {
            // Check if any search input should maintain focus
            Object.keys(searchInputRefs.current).forEach(itemId => {
                const input = searchInputRefs.current[itemId];
                if (input && document.activeElement !== input) {
                    // Always try to refocus if the input is visible and in the DOM
                    if (input && document.contains(input) && input.offsetParent !== null) {
                        setTimeout(() => {
                            if (input && document.contains(input)) {
                                input.focus();
                            }
                        }, 0);
                    }
                }
            });
        };

        // Use a small delay to ensure the DOM has updated
        const timeoutId = setTimeout(maintainFocus, 10);
        return () => clearTimeout(timeoutId);
    }, [vehicleSearchTerms]);

    const handleOrganizationSelect = (org: Organization | null) => {
        setSelectedOrg(org);
        
        if (org) {
            setData('organization_id', org.id.toString());
            setOrderItems([]);
            setVehicleSearchTerm('');
            setVehicleSearchTerms({});
            setUsedVehicles(new Set()); // Clear used vehicles when organization changes
            
            getAllVehicles((vehicles: Vehicle[]) => {
                setVehicles(vehicles);
                // Auto-select first vehicle and its fuel
                if (vehicles.length > 0) {
                    const firstVehicle = vehicles[0];
                    const newItem: OrderItem = {
                        id: Date.now().toString(),
                        vehicle_id: firstVehicle.id.toString(),
                        fuel_id: firstVehicle.fuel_id ? firstVehicle.fuel_id.toString() : '',
                        fuel_qty: '',
                        total_price: 0,
                        per_ltr_price: firstVehicle.fuel ? firstVehicle.fuel.price : 0
                    };
                    setOrderItems([newItem]);
                }
            }, { organization_id: org.id.toString() });
        } else {
            setData('organization_id', '');
            setOrderItems([]);
            setVehicles([]);
            setUsedVehicles(new Set());
        }
    };

    const addOrderItem = () => {
        const newItem: OrderItem = {
            id: Date.now().toString(),
            vehicle_id: '',
            fuel_id: '',
            fuel_qty: '',
            total_price: 0,
            per_ltr_price: 0
        };
        setOrderItems([...orderItems, newItem]);
    };


    const removeOrderItem = (itemId: string) => {
        setOrderItems(orderItems.filter(item => item.id !== itemId));
    };

    const updateOrderItem = (itemId: string, field: keyof OrderItem, value: string | number) => {
        setOrderItems(orderItems.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                
                // Validate vehicle selection - check if vehicle is already used by another item
                if (field === 'vehicle_id' && value) {
                    const vehicleId = parseInt(value.toString());
                    const isAlreadyUsed = Array.from(orderItems)
                        .filter(otherItem => otherItem.id !== itemId)
                        .some(otherItem => parseInt(otherItem.vehicle_id) === vehicleId);
                    
                    if (isAlreadyUsed) {
                        alert(`This vehicle is already selected in another order item. Please choose a different vehicle.`);
                        return item; // Don't update if vehicle is already used
                    }
                    
                    // Auto-select the associated fuel for the vehicle
                    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
                    if (selectedVehicle && selectedVehicle.fuel_id) {
                        updatedItem.fuel_id = selectedVehicle.fuel_id.toString();
                        updatedItem.per_ltr_price = selectedVehicle.fuel ? selectedVehicle.fuel.price : 0;
                    }
                }
                
                // Calculate total price when fuel or quantity changes
                if (field === 'fuel_id' || field === 'fuel_qty' || (field === 'vehicle_id' && updatedItem.fuel_id)) {
                    const fuel = fuels.find(f => f.id.toString() === updatedItem.fuel_id);
                    const quantity = parseFloat(updatedItem.fuel_qty) || 0;
                    const price = fuel?.price || 0;
                    updatedItem.total_price = quantity * price;
                }
                
                // Calculate per liter price when fuel or quantity changes
                if (field === 'fuel_id' || field === 'per_ltr_price' || (field === 'vehicle_id' && updatedItem.fuel_id)) {
                    const fuel = fuels.find(f => f.id.toString() === updatedItem.fuel_id);
                    const price = fuel?.price || 0;
                    updatedItem.per_ltr_price = price;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Enter - add new vehicle and focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                addVehicleAndFocus();
            }
            
            // Alt + Enter - submit form
            if (e.altKey && e.key === 'Enter') {
                e.preventDefault();
                if (isValid) {
                    handleSubmit(e as any);
                }
            }
            
            // Tab navigation between input fields (only when not in search input)
            if (e.key === 'Tab' && !(e.target as Element)?.closest('[data-search-input]')) {
                e.preventDefault();
                const focusableElements = document.querySelectorAll(
                    'input:not([disabled]):not([data-search-input]), select:not([disabled]), button:not([disabled])'
                );
                
                // Find current element index
                const currentElement = e.target as HTMLElement;
                const currentIndex = Array.from(focusableElements).indexOf(currentElement);
                
                if (e.shiftKey) {
                    // Shift + Tab - go to previous element
                    const newIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                    (focusableElements[newIndex] as HTMLElement)?.focus();
                } else {
                    // Tab - go to next element
                    const newIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                    (focusableElements[newIndex] as HTMLElement)?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [data.organization_id, isValid]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValid) {
            const incompleteItems = orderItems.filter(item => 
                !item.vehicle_id || !item.fuel_id || !item.fuel_qty || parseFloat(item.fuel_qty) <= 0
            );
            
            if (incompleteItems.length > 0) {
                alert(`Please complete all vehicle details. ${incompleteItems.length} item(s) are incomplete.`);
                return;
            }
            
            if (!data.organization_id) {
                alert('Please select an organization');
                return;
            }
            
            if (orderItems.length === 0) {
                alert('Please add at least one vehicle');
                return;
            }
        }
        
        post(ordersRoute.store().url, {
            onSuccess: () => {
                reset();
                setOrderItems([]);
                setVehicleSearchTerms({});
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Orders',
            href: ordersRoute.index().url,
        },
        {
            title: 'Create Order',
            href: ordersRoute.create().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Order" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
                        <p className="text-muted-foreground">
                            Add a new fuel order to the system
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(ordersRoute.index().url)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Orders
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-w-4xl mx-auto space-y-6 border rounded-lg p-6">
                        {/* Order Header */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sold Date */}
                            <div className="space-y-2">
                                <Label htmlFor="sold_date" className="text-base font-medium">Sold Date *</Label>
                                <Input
                                    id="sold_date"
                                    type="date"
                                    value={data.sold_date}
                                    onChange={(e) => handleInputChange('sold_date', e.target.value)}
                                    className="h-12"
                                />
                                {errors.sold_date && (
                                    <p className="text-sm text-destructive">{errors.sold_date}</p>
                                )}
                            </div>

                            {/* Organization Selection */}
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Organization *</Label>
                                <OrganizationSelector
                                    organizations={organizations}
                                    selectedOrganization={selectedOrg}
                                    onOrganizationSelect={handleOrganizationSelect}
                                    placeholder="Select organization"
                                />
                                {errors.organization_id && (
                                    <p className="text-sm text-destructive">{errors.organization_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Order Items - Simplified */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Add Vehicles</h3>
                            </div>

                            {orderItems.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">Select an organization to see vehicles</p>
                                    {vehicles.length > 0 && (
                                        <p className="text-xs mt-2 text-green-600">
                                            {vehicles.length} vehicles loaded
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => {
                                        const isComplete = item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0;
                                        return (
                                            <div key={item.id} data-item-id={item.id} className={`border rounded-lg p-4 bg-card transition-all duration-200 ${!isComplete ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' : 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                                        {!isComplete && (
                                                            <span className="text-xs text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                                                                Incomplete
                                                            </span>
                                                        )}
                                                        {isComplete && (
                                                            <span className="text-xs text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                                ✓ Complete
                                                            </span>
                                                        )}
                                                    </div>
                                                    {orderItems.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeOrderItem(item.id)}
                                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                        
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    {/* Vehicle */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium">Vehicle</Label>
                                                        <Select
                                                            value={item.vehicle_id}
                                                            onValueChange={(value) => {
                                                                updateOrderItem(item.id, 'vehicle_id', value);
                                                                // Close dropdown after selection
                                                                setOpenDropdowns(prev => ({ ...prev, [item.id]: false }));
                                                            }}
                                                            open={openDropdowns[item.id] || false}
                                                            onOpenChange={(open) => {
                                                                setOpenDropdowns(prev => ({ ...prev, [item.id]: open }));
                                                                if (open) {
                                                                    // Focus the search input when dropdown opens
                                                                    setTimeout(() => {
                                                                        const input = searchInputRefs.current[item.id];
                                                                        if (input) {
                                                                            input.focus();
                                                                        }
                                                                    }, 100);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div className="relative p-2 border-b">
                                                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        ref={(el) => {
                                                                            searchInputRefs.current[item.id] = el;
                                                                        }}
                                                                        data-search-input="true"
                                                                        placeholder="Search vehicles..."
                                                                        value={vehicleSearchTerms[item.id] || ''}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSearchChange(item.id, e.target.value);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            e.stopPropagation();
                                                                            
                                                                            // Handle Tab to close dropdown and move to next field
                                                                            if (e.key === 'Tab') {
                                                                                setOpenDropdowns(prev => ({ ...prev, [item.id]: false }));
                                                                                // Don't prevent default - let Tab work normally
                                                                                return;
                                                                            }
                                                                            
                                                                            // Get filtered vehicles for this item
                                                                            const filteredVehicles = vehicles.filter(vehicle => {
                                                                                const isUsed = usedVehicles.has(vehicle.id) && parseInt(item.vehicle_id) !== vehicle.id;
                                                                                if (isUsed) return false;
                                                                                
                                                                                const searchTerm = (vehicleSearchTerms[item.id] || '').replace('-', '').toLowerCase();
                                                                                const nameMatch = vehicle.name?.toLowerCase().includes(searchTerm);
                                                                                const ucodeMatch = vehicle.ucode?.toLowerCase().includes(searchTerm);
                                                                                const modelMatch = vehicle.model?.toLowerCase().includes(searchTerm);
                                                                                
                                                                                return nameMatch || ucodeMatch || modelMatch;
                                                                            });
                                                                            
                                                                            // Handle arrow keys and Enter for navigation
                                                                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                                                                                handleVehicleKeyDown(e, item.id, filteredVehicles);
                                                                            }
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            e.currentTarget.focus();
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.stopPropagation();
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.stopPropagation();
                                                                            // Prevent blur if the input is still visible
                                                                            if (e.currentTarget.offsetParent !== null) {
                                                                                setTimeout(() => {
                                                                                    e.currentTarget.focus();
                                                                                }, 0);
                                                                            }
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.stopPropagation();
                                                                        }}
                                                                        className="pl-10 h-8"
                                                                        autoComplete="off"
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto">
                                                                    {vehicles.length === 0 ? (
                                                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                                                            No vehicles found for this organization
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <div className="p-2 text-xs text-muted-foreground border-b">
                                                                                {vehicles.length} vehicles available
                                                                                {usedVehicles.size > 0 && (
                                                                                    <span className="ml-2 text-orange-600">
                                                                                        ({usedVehicles.size} already used)
                                                                                    </span>
                                                                                )}
                                                                                <div className="mt-1 text-xs text-blue-600">
                                                                                    Use ↑↓ arrows to navigate, Enter to select • Tab to next field
                                                                                </div>
                                                                            </div>
                                                                            {vehicles
                                                                                .filter(vehicle => {
                                                                                    // Filter out already used vehicles (except the current item's vehicle)
                                                                                    const isUsed = usedVehicles.has(vehicle.id) && parseInt(item.vehicle_id) !== vehicle.id;
                                                                                    if (isUsed) return false;

                                                                                    // Apply search filter
                                                                                    const searchTerm = (vehicleSearchTerms[item.id] || '').replace('-', '').toLowerCase();

                                                                                    // Check name, ucode, or model for match
                                                                                    const nameMatch = vehicle.name?.toLowerCase().includes(searchTerm);
                                                                                    const ucodeMatch = vehicle.ucode?.toLowerCase().includes(searchTerm);
                                                                                    const modelMatch = vehicle.model?.toLowerCase().includes(searchTerm);

                                                                                    return nameMatch || ucodeMatch || modelMatch;
                                                                                })
                                                                                .map((vehicle, index) => {
                                                                                    const isCurrentlyUsed = usedVehicles.has(vehicle.id) && parseInt(item.vehicle_id) !== vehicle.id;
                                                                                    const isSelected = selectedVehicleIndex[item.id] === index;
                                                                                    return (
                                                                                        <SelectItem 
                                                                                            key={vehicle.id} 
                                                                                            value={vehicle.id.toString()}
                                                                                            disabled={isCurrentlyUsed}
                                                                                            className={isSelected ? "bg-accent text-accent-foreground" : ""}
                                                                                        >
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Car className="h-3 w-3" />
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-sm">{vehicle.name}</span>
                                                                                                    <span className="text-xs text-muted-foreground">
                                                                                                        {vehicle.ucode} • {vehicle.model || 'No model'}
                                                                                                        {isCurrentlyUsed && (
                                                                                                            <span className="ml-2 text-orange-600 font-medium">
                                                                                                                (Already used)
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Fuel */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium">Fuel</Label>
                                                        <Select
                                                            value={item.fuel_id}
                                                            onValueChange={(value) => {
                                                                updateOrderItem(item.id, 'fuel_id', value);
                                                                // Focus quantity field after fuel selection
                                                                focusQuantityField(item.id);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-9" data-fuel-select>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {fuels.map((fuel) => (
                                                                    <SelectItem key={fuel.id} value={fuel.id.toString()}>
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <span className="text-sm">{fuel.name}</span>
                                                                            <span className="text-xs text-muted-foreground ml-2">৳{fuel.price}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium">Quantity (L)</Label>
                                                        <Input
                                                            data-quantity-input="true"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.fuel_qty}
                                                            onChange={(e) => updateOrderItem(item.id, 'fuel_qty', e.target.value)}
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                            onKeyDown={(e) => {
                                                                // Let the global keyboard handler manage Ctrl/Cmd + Enter
                                                                // No need to handle it here to avoid double execution
                                                            }}
                                                            placeholder="0"
                                                            className="h-9 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                        />
                                                    </div>

                                                    {/* Total */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium">Total</Label>
                                                        <div className="h-9 flex items-center justify-end px-3 bg-muted rounded-md">
                                                            <span className="text-sm font-medium">
                                                                ৳{item.total_price.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Button at Bottom */}
                            {orderItems.length > 0 && (
                                <div className="flex flex-col items-center pt-4 space-y-2">
                                    <Button
                                        type="button"
                                        onClick={addOrderItem}
                                        disabled={!data.organization_id}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Another Vehicle
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> in quantity field to add vehicle • 
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Alt+Enter</kbd> to create order • 
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Tab</kbd> to navigate fields
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Summary */}
                    {orderItems.length > 0 && (
                        <div className={`border rounded-lg p-4 max-w-4xl mx-auto transition-all duration-200 ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Vehicles: </span>
                                        <span className="font-medium">{orderItems.length}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Complete: </span>
                                        <span className="font-medium">
                                            {orderItems.filter(item => item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0).length}/{orderItems.length}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Total: </span>
                                        <span className="font-medium">
                                            {orderItems.reduce((sum, item) => sum + parseFloat(item.fuel_qty || '0'), 0).toFixed(1)}L
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                        ৳{totalOrderAmount.toLocaleString()}
                                    </div>
                                    {!isValid && (
                                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                            Complete all items to create order
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(ordersRoute.index().url)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !isValid}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
