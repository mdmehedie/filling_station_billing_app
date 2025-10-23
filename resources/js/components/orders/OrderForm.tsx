import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Car, AlertCircle, Trash2 } from "lucide-react";
import { getAllVehicles } from "@/lib/api";
import { Organization, Vehicle, Fuel as FuelType } from "@/types/response";
import { draftCache, DraftOrderItem } from "@/lib/draftCache";
import OrderItem from "./OrderItem";
import OrderSummary from "./OrderSummary";
import DraftManager from "./DraftManager";

interface OrderItemData extends DraftOrderItem { }

interface OrderFormProps {
    organizations: Organization[];
    fuels: FuelType[];
    onSubmit: (data: any) => void;
    processing: boolean;
    errors: any;
}

export default function OrderForm({ organizations, fuels, onSubmit, processing, errors }: OrderFormProps) {
    // Helper function to extract order item errors
    const getOrderItemErrors = (itemIndex: number) => {
        const itemErrors: any = {};
        Object.keys(errors).forEach(key => {
            if (key.startsWith(`order_items.${itemIndex}.`)) {
                const fieldName = key.replace(`order_items.${itemIndex}.`, '');
                itemErrors[fieldName] = errors[key];
            }
        });
        return itemErrors;
    };
    const { data, setData, reset } = useForm<{
        organization_id: string;
        sold_date: string;
        order_items: OrderItemData[];
    }>({
        organization_id: '',
        sold_date: new Date().toISOString().split('T')[0],
        order_items: []
    });

    const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
    const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle[] }>({});
    const [totalOrderAmount, setTotalOrderAmount] = useState<number>(0);
    const [vehicleSearchTerms, setVehicleSearchTerms] = useState<{ [key: string]: string }>({});
    const [isValid, setIsValid] = useState<boolean>(false);
    const [usedVehicles, setUsedVehicles] = useState<Set<number>>(new Set());
    const searchInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement | null> }>({});
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<{ [key: string]: number }>({});
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
    const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);
    const [hasDraftForDate, setHasDraftForDate] = useState<boolean>(false);
    const [availableDraftDates, setAvailableDraftDates] = useState<string[]>([]);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Handle draft clearing
    const handleDraftCleared = (date: string) => {
        if (date === 'all') {
            // Clear all drafts
            setOrderItems([]);
            setAvailableDraftDates([]);
            setHasDraftForDate(false);
            
            // Add new empty item
            const newItem: OrderItemData = {
                id: Date.now().toString(),
                organization_id: '',
                vehicle_id: '',
                fuel_id: '',
                fuel_qty: '',
                total_price: 0,
                per_ltr_price: 0
            };
            setOrderItems([newItem]);
        } else if (date === data.sold_date) {
            // Clear current date's draft
            setOrderItems([]);
            setHasDraftForDate(false);
            
            // Add new empty item
            const newItem: OrderItemData = {
                id: Date.now().toString(),
                organization_id: '',
                vehicle_id: '',
                fuel_id: '',
                fuel_qty: '',
                total_price: 0,
                per_ltr_price: 0
            };
            setOrderItems([newItem]);
        }
        
        // Reload available draft dates
        setAvailableDraftDates(draftCache.getDraftDates());
    };

    // Handle draft selection (switching to another date's draft)
    const handleDraftSelected = (date: string) => {
        // Update the date input to the selected date
        setData('sold_date', date);
    };

    // Focus date field on component mount and add initial item
    useEffect(() => {
        if (dateInputRef.current) {
            dateInputRef.current.focus();
        }
        
        // Clean up expired drafts on component mount
        draftCache.cleanupExpiredDrafts();
        
        // Load available draft dates
        setAvailableDraftDates(draftCache.getDraftDates());
        
        // Add initial empty item if no items exist
        if (orderItems.length === 0) {
            const newItem: OrderItemData = {
                id: Date.now().toString(),
                organization_id: '',
                vehicle_id: '',
                fuel_id: '',
                fuel_qty: '',
                total_price: 0,
                per_ltr_price: 0
            };
            setOrderItems([newItem]);
        }
    }, []);

    // Load draft when date changes
    useEffect(() => {
        if (data.sold_date) {
            const draft = draftCache.loadDraftForDate(data.sold_date);
            if (draft) {
                setOrderItems(draft.order_items);
                
                // Load vehicles for each organization in the draft
                const uniqueOrgIds = [...new Set(draft.order_items.map(item => item.organization_id))];
                uniqueOrgIds.forEach(orgId => {
                    getAllVehicles((vehicles: Vehicle[]) => {
                        setVehicles(prev => ({ ...prev, [orgId]: vehicles }));
                    }, { organization_id: orgId });
                });
                
                setHasDraftForDate(true);
                setIsDraftLoaded(true);
            } else {
                setHasDraftForDate(false);
                setIsDraftLoaded(true);
                
                // If no draft exists and no items, add a new empty item
                if (orderItems.length === 0) {
                    const newItem: OrderItemData = {
                        id: Date.now().toString(),
                        organization_id: '',
                        vehicle_id: '',
                        fuel_id: '',
                        fuel_qty: '',
                        total_price: 0,
                        per_ltr_price: 0
                    };
                    setOrderItems([newItem]);
                }
            }
            
            // Update available draft dates
            setAvailableDraftDates(draftCache.getDraftDates());
        }
    }, [data.sold_date, organizations]);

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
            item.organization_id && item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0
        );
        setIsValid(allItemsValid && orderItems.length > 0);

        // Save draft when items change (only if we have a date)
        if (data.sold_date && isDraftLoaded) {
            // Use the first item's organization_id for the draft, or empty string if no items
            const firstOrgId = orderItems.length > 0 ? orderItems[0].organization_id : '';
            draftCache.updateDraftItems(orderItems, data.sold_date, firstOrgId);
        }
    }, [orderItems, setData, data.organization_id, data.sold_date, isDraftLoaded]);

    const handleInputChange = (field: keyof typeof data, value: string) => {
        setData(field, value);
    };

    // Handle organization change for individual items
    const handleItemOrganizationChange = (itemId: string, organizationId: string) => {
        // Load vehicles for this organization if not already loaded
        if (!vehicles[organizationId]) {
            getAllVehicles((vehicles: Vehicle[]) => {
                setVehicles(prev => ({ ...prev, [organizationId]: vehicles }));
            }, { organization_id: organizationId });
        }

        // Clear vehicle and fuel selection when organization changes
        setOrderItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    organization_id: organizationId,
                    vehicle_id: '',
                    fuel_id: '',
                    fuel_qty: '',
                    total_price: 0,
                    per_ltr_price: 0
                };
            }
            return item;
        }));
    };

    // Stable search handler to prevent re-renders
    const handleSearchChange = useCallback((itemId: string, value: string) => {
        setVehicleSearchTerms(prev => ({ ...prev, [itemId]: value }));
        setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: 0 }));

        // Maintain focus even when input becomes empty
        setTimeout(() => {
            const input = searchInputRefs.current[itemId]?.current;
            if (input && document.contains(input) && input.offsetParent !== null) {
                input.focus();
            }
        }, 0);
    }, []);

    // Focus next field after vehicle selection
    const focusNextField = useCallback((itemId: string) => {
        const fuelSelectTrigger = document.querySelector(`[data-item-id="${itemId}"] [data-fuel-select]`);
        if (fuelSelectTrigger) {
            setTimeout(() => {
                (fuelSelectTrigger as HTMLElement)?.focus();
            }, 100);
        }
    }, []);

    // Focus quantity field after fuel selection
    const focusQuantityField = useCallback((itemId: string) => {
        const quantityInput = document.querySelector(`[data-item-id="${itemId}"] [data-quantity-input]`);
        if (quantityInput) {
            setTimeout(() => {
                (quantityInput as HTMLElement)?.focus();
            }, 100);
        }
    }, []);

    // Update order item function
    const updateOrderItem = useCallback((itemId: string, field: keyof OrderItemData, value: string | number) => {
        setOrderItems(prevOrderItems => {
            return prevOrderItems.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };

                    // Validate vehicle selection - check if vehicle is already used by another item
                    if (field === 'vehicle_id' && value) {
                        const vehicleId = parseInt(value.toString());
                        const isAlreadyUsed = Array.from(prevOrderItems)
                            .filter(otherItem => otherItem.id !== itemId)
                            .some(otherItem => parseInt(otherItem.vehicle_id) === vehicleId);

                        if (isAlreadyUsed) {
                            alert(`This vehicle is already selected in another order item. Please choose a different vehicle.`);
                            return item;
                        }

                        // Auto-select the associated fuel for the vehicle
                        const itemVehicles = vehicles[updatedItem.organization_id] || [];
                        const selectedVehicle = itemVehicles.find(v => v.id === vehicleId);
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
            });
        });
    }, [vehicles, fuels]);

    // Add new vehicle and focus its search input
    const addVehicleAndFocus = useCallback(() => {
        const newItem: OrderItemData = {
            id: Date.now().toString(),
            organization_id: '',
            vehicle_id: '',
            fuel_id: '',
            fuel_qty: '',
            total_price: 0,
            per_ltr_price: 0
        };

        setOrderItems(prev => [...prev, newItem]);

        // Focus on the new item's organization field and auto-open it
        setTimeout(() => {
            const newOrgSelector = document.querySelector(`[data-item-id="${newItem.id}"] [data-organization-trigger]`) as HTMLElement;
            if (newOrgSelector) {
                newOrgSelector.focus();
                setTimeout(() => newOrgSelector.click(), 50);
            }
        }, 100);
    }, []);

    // Handle keyboard navigation for vehicle selection
    const handleVehicleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string, filteredVehicles: Vehicle[]) => {
        const currentIndex = selectedVehicleIndex[itemId] || 0;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = Math.min(currentIndex + 1, filteredVehicles.length - 1);
            setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: nextIndex }));
            
            // Scroll the selected item into view
            setTimeout(() => {
                const selectedElement = document.querySelector(`[data-item-id="${itemId}"] [data-vehicle-dropdown] [data-vehicle-item="${nextIndex}"]`);
                if (selectedElement) {
                    selectedElement.scrollIntoView({ block: 'nearest' });
                }
            }, 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = Math.max(currentIndex - 1, 0);
            setSelectedVehicleIndex(prev => ({ ...prev, [itemId]: prevIndex }));
            
            // Scroll the selected item into view
            setTimeout(() => {
                const selectedElement = document.querySelector(`[data-item-id="${itemId}"] [data-vehicle-dropdown] [data-vehicle-item="${prevIndex}"]`);
                if (selectedElement) {
                    selectedElement.scrollIntoView({ block: 'nearest' });
                }
            }, 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredVehicles.length > 0 && currentIndex < filteredVehicles.length) {
                const selectedVehicle = filteredVehicles[currentIndex];
                
                // Get the current item to check if this vehicle is already selected
                const currentItem = orderItems.find(item => item.id === itemId);
                const isCurrentlyUsed = usedVehicles.has(selectedVehicle.id) && 
                    currentItem && parseInt(currentItem.vehicle_id) !== selectedVehicle.id;
                
                if (!isCurrentlyUsed) {
                    // Update the vehicle selection
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

                    setOpenDropdowns(prev => ({ ...prev, [itemId]: false }));
                    focusNextField(itemId);
                }
            }
        }
    }, [selectedVehicleIndex, focusNextField, usedVehicles, orderItems, updateOrderItem]);

    // Maintain focus on search input
    useEffect(() => {
        const maintainFocus = () => {
            Object.keys(searchInputRefs.current).forEach(itemId => {
                const input = searchInputRefs.current[itemId]?.current;
                if (input && document.activeElement !== input) {
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

        const timeoutId = setTimeout(maintainFocus, 10);
        return () => clearTimeout(timeoutId);
    }, [vehicleSearchTerms]);


    const addOrderItem = () => {
        // Allow adding items even without organization selected
        const newItem: OrderItemData = {
            id: Date.now().toString(),
            organization_id: '',
            vehicle_id: '',
            fuel_id: '',
            fuel_qty: '',
            total_price: 0,
            per_ltr_price: 0
        };
        setOrderItems([...orderItems, newItem]);
        
        // Focus on the new item's organization field and auto-open it
        setTimeout(() => {
            const newOrgSelector = document.querySelector(`[data-item-id="${newItem.id}"] [data-organization-trigger]`) as HTMLElement;
            if (newOrgSelector) {
                newOrgSelector.focus();
                setTimeout(() => newOrgSelector.click(), 50);
            }
        }, 100);
    };

    const removeOrderItem = (itemId: string) => {
        const newItems = orderItems.filter(item => item.id !== itemId);
        setOrderItems(newItems);
        
        // If no items left, add a new empty item
        if (newItems.length === 0) {
            const newItem: OrderItemData = {
                id: Date.now().toString(),
                organization_id: '',
                vehicle_id: '',
                fuel_id: '',
                fuel_qty: '',
                total_price: 0,
                per_ltr_price: 0
            };
            setOrderItems([newItem]);
            
            // Focus on the new item's organization field and auto-open it
            setTimeout(() => {
                const newOrgSelector = document.querySelector(`[data-item-id="${newItem.id}"] [data-organization-trigger]`) as HTMLElement;
                if (newOrgSelector) {
                    newOrgSelector.focus();
                    setTimeout(() => newOrgSelector.click(), 50);
                }
            }, 100);
        }
    };


    // Enhanced keyboard navigation for smooth UX
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle keyboard events within the form
            const formElement = document.getElementById('order-form');
            if (!formElement || !formElement.contains(e.target as Node)) {
                return;
            }

            const target = e.target as HTMLElement;
            const isInDropdown = target.closest('[role="listbox"]') || 
                target.closest('[role="combobox"]') || 
                target.closest('[data-radix-popper-content-wrapper]') ||
                target.closest('[data-organization-selector]') ||
                target.closest('[data-organization-dropdown]') ||
                target.hasAttribute('data-search-input') ||
                target.closest('[data-search-input]');
            
            // Skip all global keyboard handling for search inputs
            if (target.hasAttribute('data-search-input')) {
                return;
            }

            // Ctrl/Cmd + Enter - add new vehicle
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                addVehicleAndFocus();
                return;
            }

            // Alt + Enter - submit form
            if (e.altKey && e.key === 'Enter') {
                e.preventDefault();
                if (isValid) {
                    onSubmit(data);
                }
                return;
            }

            // Tab key - smooth navigation between fields
            if (e.key === 'Tab') {
                // Allow native tab behavior for dropdowns
                if (isInDropdown) {
                    return;
                }

                e.preventDefault();
                // Only include the 5 essential fields: date, organization, vehicle, fuel, quantity
                const focusableElements = Array.from(
                    formElement.querySelectorAll(
                        'input[type="date"]:not([disabled]), [data-organization-trigger]:not([disabled]), [data-vehicle-select]:not([disabled]), [data-fuel-select]:not([disabled]), [data-quantity-input]:not([disabled])'
                    )
                ) as HTMLElement[];

                const currentIndex = focusableElements.indexOf(target);

                if (e.shiftKey) {
                    // Shift + Tab - go to previous element
                    const newIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                    focusableElements[newIndex]?.focus();
                    // Auto-open selects on focus
                    if (focusableElements[newIndex]?.hasAttribute('data-organization-trigger') ||
                        focusableElements[newIndex]?.hasAttribute('data-fuel-select')) {
                        setTimeout(() => focusableElements[newIndex]?.click(), 50);
                    }
                } else {
                    // Tab - go to next element
                    const newIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                    focusableElements[newIndex]?.focus();
                    // Auto-open select fields when tabbing into them
                    if (focusableElements[newIndex]?.hasAttribute('data-organization-trigger') ||
                        focusableElements[newIndex]?.hasAttribute('data-fuel-select')) {
                        setTimeout(() => focusableElements[newIndex]?.click(), 50);
                    }
                }
                return;
            }

            // Arrow keys - only for dropdowns, let them handle their own navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (isInDropdown) {
                    // Let the dropdown handle arrow keys
                    return;
                }

                // For closed select fields, open them with arrow keys
                if (target.hasAttribute('data-organization-trigger') || 
                    target.hasAttribute('data-fuel-select')) {
                    e.preventDefault();
                    target.click();
                    return;
                }
            }

            // Enter key - confirm selection and move to next field
            if (e.key === 'Enter') {
                // Let dropdowns handle their own Enter key
                if (isInDropdown) {
                    return;
                }

                // Handle date input - move to first organization field
                if (target.getAttribute('type') === 'date') {
                    e.preventDefault();
                    const firstOrgSelector = formElement.querySelector('[data-organization-trigger]') as HTMLElement;
                    if (firstOrgSelector) {
                        firstOrgSelector.focus();
                        setTimeout(() => firstOrgSelector.click(), 50);
                    }
                    return;
                }

                // Handle quantity input - add new item and focus on next organization
                if (target.hasAttribute('data-quantity-input')) {
                    e.preventDefault();
                    
                    // Find the current item's index
                    const currentItemElement = target.closest('[data-item-id]');
                    const currentItemId = currentItemElement?.getAttribute('data-item-id');
                    const currentItem = orderItems.find(item => item.id === currentItemId);
                    const currentItemIndex = orderItems.findIndex(item => item.id === currentItemId);
                    
                    // Check if this is the last item
                    const isLastItem = currentItemIndex === orderItems.length - 1;
                    
                    // Check if current item is complete
                    const isItemComplete = currentItem && 
                        currentItem.organization_id && 
                        currentItem.vehicle_id && 
                        currentItem.fuel_id && 
                        currentItem.fuel_qty && 
                        parseFloat(currentItem.fuel_qty) > 0;
                    
                    // If it's the last item and complete, always add new item
                    if (isLastItem && isItemComplete) {
                        // Add new item
                        const newItem: OrderItemData = {
                            id: Date.now().toString(),
                            organization_id: '',
                            vehicle_id: '',
                            fuel_id: '',
                            fuel_qty: '',
                            total_price: 0,
                            per_ltr_price: 0
                        };
                        setOrderItems([...orderItems, newItem]);
                        
                        // Focus on the new item's organization field
                        setTimeout(() => {
                            const newOrgSelector = document.querySelector(`[data-item-id="${newItem.id}"] [data-organization-trigger]`) as HTMLElement;
                            if (newOrgSelector) {
                                newOrgSelector.focus();
                                setTimeout(() => newOrgSelector.click(), 50);
                            }
                        }, 100);
                    } else if (!isLastItem) {
                        // If not last item, move to next item's organization field
                        const nextItem = orderItems[currentItemIndex + 1];
                        if (nextItem) {
                            setTimeout(() => {
                                const nextOrgSelector = document.querySelector(`[data-item-id="${nextItem.id}"] [data-organization-trigger]`) as HTMLElement;
                                if (nextOrgSelector) {
                                    nextOrgSelector.focus();
                                    setTimeout(() => nextOrgSelector.click(), 50);
                                }
                            }, 50);
                        }
                    } else {
                        // Last item but incomplete - stay on current field or show warning
                        if (!isItemComplete) {
                            // Optionally show a subtle indication that the item needs to be completed
                            target.classList.add('ring-2', 'ring-orange-400');
                            setTimeout(() => {
                                target.classList.remove('ring-2', 'ring-orange-400');
                            }, 1000);
                        }
                    }
                    return;
                }

                // Handle buttons
                if (target.tagName === 'BUTTON') {
                    // Let the button click happen naturally
                    return;
                }
            }

            // Escape key - close dropdowns
            if (e.key === 'Escape') {
                if (isInDropdown) {
                    // Find and focus the trigger element
                    const trigger = target.closest('[data-radix-popper-content-wrapper]')?.previousElementSibling as HTMLElement;
                    if (trigger) {
                        setTimeout(() => trigger.focus(), 50);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isValid, addVehicleAndFocus, onSubmit, data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear draft cache for this date when submitting
        draftCache.clearDraftForDate(data.sold_date);
        
        onSubmit(data);
    };

    return (
        <div className="focus-within:outline-none" tabIndex={-1}>
            <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="max-w-7xl mx-auto space-y-6 border rounded-lg p-6">
                    {/* Global Errors */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</h4>
                            <ul className="text-sm text-destructive space-y-1">
                                {Object.entries(errors).map(([key, value]) => (
                                    <li key={key}>• {value as string}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Order Header */}
                    <div className="space-y-6">
                        {/* Sold Date - At the top */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="sold_date" className="text-base font-medium">Sold Date *</Label>
                                <DraftManager
                                    currentDate={data.sold_date}
                                    onDraftCleared={handleDraftCleared}
                                    onDraftSelected={handleDraftSelected}
                                />
                            </div>
                            <Input
                                ref={dateInputRef}
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
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add Vehicles</h3>
                            {hasDraftForDate && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDraftCleared(data.sold_date)}
                                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear Current Draft
                                </Button>
                            )}
                        </div>

                        {orderItems.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">
                                    {hasDraftForDate 
                                        ? "Draft loaded for this date" 
                                        : "No vehicles added yet"
                                    }
                                </p>
                                {Object.keys(vehicles).length > 0 && (
                                    <p className="text-xs mt-2 text-green-600">
                                        {Object.values(vehicles).flat().length} vehicles loaded
                                    </p>
                                )}
                                {hasDraftForDate && (
                                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-blue-600">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Draft data restored from cache</span>
                                    </div>
                                )}
                                {availableDraftDates.length > 0 && !hasDraftForDate && (
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        <p className="mb-2">Available drafts for other dates:</p>
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {availableDraftDates.slice(0, 3).map(date => (
                                                <span 
                                                    key={date}
                                                    className="px-2 py-1 bg-muted rounded text-xs"
                                                >
                                                    {new Date(date).toLocaleDateString()}
                                                </span>
                                            ))}
                                            {availableDraftDates.length > 3 && (
                                                <span className="px-2 py-1 bg-muted rounded text-xs">
                                                    +{availableDraftDates.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!hasDraftForDate && (
                                    <div className="mt-4">
                                        <Button
                                            type="button"
                                            onClick={addOrderItem}
                                            className="flex items-center gap-2"
                                            tabIndex={0}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add First Vehicle
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orderItems.map((item, index) => 
                                    React.createElement(OrderItem, {
                                        key: item.id,
                                        item: item,
                                        index: index,
                                        organizations: organizations,
                                        vehicles: vehicles[item.organization_id] || [],
                                        fuels: fuels,
                                        usedVehicles: usedVehicles,
                                        searchTerm: vehicleSearchTerms[item.id] || '',
                                        onSearchChange: (value: string) => handleSearchChange(item.id, value),
                                        selectedIndex: selectedVehicleIndex[item.id] || 0,
                                        onKeyDown: (e: React.KeyboardEvent, filteredVehicles: any[]) => handleVehicleKeyDown(e, item.id, filteredVehicles),
                                        isDropdownOpen: openDropdowns[item.id] || false,
                                        onDropdownOpenChange: (open: boolean) => setOpenDropdowns(prev => ({ ...prev, [item.id]: open })),
                                        searchInputRef: (() => {
                                            if (!searchInputRefs.current[item.id]) {
                                                searchInputRefs.current[item.id] = React.createRef<HTMLInputElement | null>();
                                            }
                                            return searchInputRefs.current[item.id]!;
                                        })(),
                                        onUpdate: (field: keyof OrderItemData, value: string | number) => updateOrderItem(item.id, field, value),
                                        onRemove: () => removeOrderItem(item.id),
                                        onFocusQuantity: () => focusQuantityField(item.id),
                                        onOrganizationChange: (orgId: string) => handleItemOrganizationChange(item.id, orgId),
                                        canRemove: true,
                                        errors: getOrderItemErrors(index)
                                    })
                                )}
                            </div>
                        )}

                        {/* Add Button at Bottom */}
                        {orderItems.length > 0 && (
                            <div className="flex flex-col items-center pt-4 space-y-2">
                                <Button
                                    type="button"
                                    onClick={addOrderItem}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    tabIndex={-1}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Another Vehicle
                                </Button>
                                <div className="text-xs text-muted-foreground text-center space-y-1">
                                    <p className="font-semibold text-foreground">⚡ 5-Tab Workflow</p>
                                    <p>
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> through 5 fields per item •
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">↑↓</kbd> select options •
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> confirm
                                    </p>
                                    <p>
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> on Qty field adds new vehicle •
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Alt+Enter</kbd> submit order
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Summary */}
                {orderItems.length > 0 && (
                    <OrderSummary
                        orderItems={orderItems}
                        totalOrderAmount={totalOrderAmount}
                        isValid={isValid}
                    />
                )}
            </form>
        </div>
    );
}
