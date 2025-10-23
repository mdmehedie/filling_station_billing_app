import { Label } from "@/components/ui/label";

interface OrderItemTotalProps {
    totalPrice: number;
}

export default function OrderItemTotal({
    totalPrice
}: OrderItemTotalProps) {
    return (
        <div className="w-28 min-w-[100px]">
            <Label className="text-xs font-medium">Total</Label>
            <div className="h-9 flex items-center justify-end px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                    ৳{totalPrice.toLocaleString()}
                </span>
            </div>
        </div>
    );
}
