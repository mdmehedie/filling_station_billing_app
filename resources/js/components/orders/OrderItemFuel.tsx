import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel as FuelType } from "@/types/response";

interface OrderItemFuelProps {
    fuelId: string;
    fuels: FuelType[];
    onUpdate: (field: keyof { organization_id: string; vehicle_id: string; fuel_id: string; fuel_qty: string; total_price: number; per_ltr_price: number }, value: string | number) => void;
    onFocusQuantity: () => void;
}

export default function OrderItemFuel({
    fuelId,
    fuels,
    onUpdate,
    onFocusQuantity
}: OrderItemFuelProps) {
    return (
        <div className="w-32 min-w-[150px]">
            <Label className="text-xs font-medium">Fuel</Label>
            <Select
                value={fuelId}
                onValueChange={(value) => {
                    onUpdate('fuel_id', value);
                    onFocusQuantity();
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
    );
}
