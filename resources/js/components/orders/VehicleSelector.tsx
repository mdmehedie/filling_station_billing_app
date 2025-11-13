import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Car } from "lucide-react";
import { Vehicle } from "@/types/response";
import { useCallback, useEffect } from "react";

interface VehicleSelectorProps {
    itemId: string;
    selectedVehicleId: string;
    onVehicleSelect: (vehicleId: string) => void;
    vehicles: Vehicle[];
    usedVehicles: Set<number>;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedIndex: number;
    onKeyDown: (e: React.KeyboardEvent, filteredVehicles: Vehicle[]) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function VehicleSelector({
    selectedVehicleId,
    onVehicleSelect,
    vehicles,
    usedVehicles,
    searchTerm,
    onSearchChange,
    selectedIndex,
    onKeyDown,
    isOpen,
    onOpenChange,
    searchInputRef
}: VehicleSelectorProps) {
    const filteredVehicles = vehicles.filter(vehicle => {
        const isUsed = usedVehicles.has(vehicle.id) && parseInt(selectedVehicleId) !== vehicle.id;
        if (isUsed) return false;

        const searchTermLower = searchTerm.replace('-', '').toLowerCase();
        const nameMatch = vehicle.name?.toLowerCase().includes(searchTermLower);
        const ucodeMatch = vehicle.ucode.replace('-', '').toLowerCase().includes(searchTermLower);
        const modelMatch = vehicle.model?.toLowerCase().includes(searchTermLower);

        return nameMatch || ucodeMatch || modelMatch;
    });

    // Scroll selected item into view
    useEffect(() => {
        if (isOpen && selectedIndex >= 0) {
            const selectedElement = document.querySelector(`[data-vehicle-item="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
    }, [isOpen, searchInputRef]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Don't stop propagation for Tab - let the form handle it
        if (e.key === 'Tab') {
            onOpenChange(false);
            return;
        }

        // Handle arrow keys and Enter for navigation within dropdown
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onKeyDown(e, filteredVehicles);
        }
    }, [onKeyDown, filteredVehicles, onOpenChange]);

    return (
        <div className="space-y-1">
            <Select
                value={selectedVehicleId}
                open={isOpen}
                onOpenChange={onOpenChange}
            >
                <SelectTrigger className="h-9" tabIndex={0} data-vehicle-select>
                    {selectedVehicleId ? (
                        (() => {
                            const selectedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
                            return selectedVehicle ? (
                                <div className="flex items-center gap-2">
                                    <Car className="h-3 w-3" />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{selectedVehicle.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedVehicle.ucode} • {selectedVehicle.model || 'No model'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Select</span>
                            );
                        })()
                    ) : (
                        <span className="text-muted-foreground">Select</span>
                    )}
                </SelectTrigger>
                <SelectContent>
                    <div className="relative p-2 border-b">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            data-search-input
                            placeholder="Search vehicles..."
                            value={searchTerm}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSearchChange(e.target.value);
                            }}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                            }}
                            className="pl-10 h-8"
                            autoComplete="off"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto" data-vehicle-dropdown>
                        {vehicles.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                No vehicles found for this organization
                            </div>
                        ) : (
                            <div>
                                <div className="p-2 text-xs text-muted-foreground border-b">
                                    {filteredVehicles.length} vehicles available
                                    {usedVehicles.size > 0 && (
                                        <span className="ml-2 text-orange-600">
                                            ({usedVehicles.size} already used)
                                        </span>
                                    )}
                                    <div className="mt-1 text-xs text-blue-600">
                                        Use ↑↓ arrows to navigate, Enter to select • Tab to next field
                                    </div>
                                </div>
                                {filteredVehicles.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No vehicles match your search
                                    </div>
                                ) : (
                                    filteredVehicles.map((vehicle, index) => {
                                        const isCurrentlyUsed = usedVehicles.has(vehicle.id) && parseInt(selectedVehicleId) !== vehicle.id;
                                        const isKeyboardSelected = selectedIndex === index;
                                        const isActuallySelected = selectedVehicleId === vehicle.id.toString();

                                        return (
                                            <div
                                                key={vehicle.id}
                                                data-vehicle-item={index}
                                                className={`px-2 py-2 cursor-pointer transition-colors ${isActuallySelected
                                                    ? "bg-green-100 text-green-900 font-medium dark:bg-green-900 dark:text-green-100 border-l-4 border-green-500"
                                                    : isKeyboardSelected
                                                        ? "bg-blue-100 text-blue-900 font-medium dark:bg-blue-900 dark:text-blue-100"
                                                        : "hover:bg-accent/50"
                                                    } ${isCurrentlyUsed ? "opacity-50 cursor-not-allowed" : ""}`}
                                                onClick={() => {
                                                    if (!isCurrentlyUsed) {
                                                        onVehicleSelect(vehicle.id.toString());
                                                    }
                                                }}
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
                                                            {isActuallySelected && (
                                                                <span className="ml-2 text-green-600 font-medium">
                                                                    ✓ Selected
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {isActuallySelected && (
                                                        <div className="w-2 h-2 bg-green-600 rounded-full ml-auto"></div>
                                                    )}
                                                    {!isActuallySelected && isKeyboardSelected && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </SelectContent>
            </Select>
        </div>
    );
}
