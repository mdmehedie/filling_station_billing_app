import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OrderItemQuantityProps {
    fuelQty: string;
    onUpdate: (field: keyof { organization_id: string; vehicle_id: string; fuel_id: string; fuel_qty: string; total_price: number; per_ltr_price: number }, value: string | number) => void;
}

export default function OrderItemQuantity({
    fuelQty,
    onUpdate
}: OrderItemQuantityProps) {
    return (
        <div className="w-24 min-w-[80px]">
            <Label className="text-xs font-medium">Qty (L)</Label>
            <Input
                data-quantity-input="true"
                type="number"
                step="0.01"
                min="0"
                value={fuelQty}
                onChange={(e) => onUpdate('fuel_qty', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0"
                className="h-9 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
        </div>
    );
}
