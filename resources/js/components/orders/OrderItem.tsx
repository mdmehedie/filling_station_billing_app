import { Fuel as FuelType, Organization } from "@/types/response";
import OrderItemHeader from "./OrderItemHeader";
import OrderItemOrganization from "./OrderItemOrganization";
import OrderItemVehicle from "./OrderItemVehicle";
import OrderItemFuel from "./OrderItemFuel";
import OrderItemQuantity from "./OrderItemQuantity";
import OrderItemTotal from "./OrderItemTotal";

interface OrderItemData {
    id: string;
    organization_id: string;
    vehicle_id: string;
    fuel_id: string;
    fuel_qty: string;
    total_price: number;
    per_ltr_price: number;
}

interface OrderItemProps {
    item: OrderItemData;
    index: number;
    organizations: Organization[];
    vehicles: any[];
    fuels: FuelType[];
    usedVehicles: Set<number>;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedIndex: number;
    onKeyDown: (e: React.KeyboardEvent, filteredVehicles: any[]) => void;
    isDropdownOpen: boolean;
    onDropdownOpenChange: (open: boolean) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onUpdate: (field: keyof OrderItemData, value: string | number) => void;
    onRemove: () => void;
    onFocusQuantity: () => void;
    onOrganizationChange: (organizationId: string) => void;
    canRemove: boolean;
}

export default function OrderItem({
    item,
    index,
    organizations,
    vehicles,
    fuels,
    usedVehicles,
    searchTerm,
    onSearchChange,
    selectedIndex,
    onKeyDown,
    isDropdownOpen,
    onDropdownOpenChange,
    searchInputRef,
    onUpdate,
    onRemove,
    onFocusQuantity,
    onOrganizationChange,
    canRemove
}: OrderItemProps) {
    const isComplete = item.organization_id && item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0;

    return (
        <div 
            data-item-id={item.id} 
            className={`border rounded-lg p-4 bg-card transition-all duration-200 ${!isComplete 
                ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' 
                : 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20'
                }`}
        >
            <OrderItemHeader
                index={index}
                isComplete={!!isComplete}
                canRemove={canRemove}
                onRemove={onRemove}
            />

            <div className="flex items-end gap-3 w-full">
                <OrderItemOrganization
                    itemId={item.id}
                    organizationId={item.organization_id}
                    organizations={organizations}
                    onOrganizationChange={onOrganizationChange}
                    onUpdate={onUpdate}
                />

                <OrderItemVehicle
                    itemId={item.id}
                    vehicleId={item.vehicle_id}
                    vehicles={vehicles}
                    usedVehicles={usedVehicles}
                    searchTerm={searchTerm}
                    onSearchChange={onSearchChange}
                    selectedIndex={selectedIndex}
                    onKeyDown={onKeyDown}
                    isDropdownOpen={isDropdownOpen}
                    onDropdownOpenChange={onDropdownOpenChange}
                    searchInputRef={searchInputRef}
                    onUpdate={onUpdate}
                />

                <OrderItemFuel
                    fuelId={item.fuel_id}
                    fuels={fuels}
                    onUpdate={onUpdate}
                    onFocusQuantity={onFocusQuantity}
                />

                <OrderItemQuantity
                    fuelQty={item.fuel_qty}
                    onUpdate={onUpdate}
                />

                <OrderItemTotal
                    totalPrice={item.total_price}
                />
            </div>
        </div>
    );
}
