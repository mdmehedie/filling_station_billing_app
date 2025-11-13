import { Label } from "@/components/ui/label";
import VehicleSelector from "./VehicleSelector";
import { Vehicle } from "@/types/response";

interface OrderItemVehicleProps {
    itemId: string;
    vehicleId: string;
    vehicles: Vehicle[];
    usedVehicles: Set<number>;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedIndex: number;
    onKeyDown: (e: React.KeyboardEvent, filteredVehicles: Vehicle[]) => void;
    isDropdownOpen: boolean;
    onDropdownOpenChange: (open: boolean) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onUpdate: (field: keyof { organization_id: string; vehicle_id: string; fuel_id: string; fuel_qty: string; total_price: number; per_ltr_price: number }, value: string | number) => void;
}

export default function OrderItemVehicle({
    itemId,
    vehicleId,
    vehicles,
    usedVehicles,
    searchTerm,
    onSearchChange,
    selectedIndex,
    onKeyDown,
    isDropdownOpen,
    onDropdownOpenChange,
    searchInputRef,
    onUpdate
}: OrderItemVehicleProps) {
    return (
        <div className="flex-1 min-w-0 max-w-[300px]">
            <Label className="text-xs font-medium">Vehicle</Label>
            <VehicleSelector
                itemId={itemId}
                selectedVehicleId={vehicleId}
                onVehicleSelect={(value) => {
                    onUpdate('vehicle_id', value);
                    onDropdownOpenChange(false);
                }}
                vehicles={vehicles}
                usedVehicles={usedVehicles}
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                selectedIndex={selectedIndex}
                onKeyDown={onKeyDown}
                isOpen={isDropdownOpen}
                onOpenChange={onDropdownOpenChange}
                searchInputRef={searchInputRef}
            />
        </div>
    );
}
