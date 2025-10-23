interface OrderSummaryProps {
    orderItems: Array<{
        vehicle_id: string;
        fuel_id: string;
        fuel_qty: string;
        total_price: number;
    }>;
    totalOrderAmount: number;
    isValid: boolean;
}

export default function OrderSummary({ orderItems, totalOrderAmount, isValid }: OrderSummaryProps) {
    const completeItems = orderItems.filter(item => 
        item.vehicle_id && item.fuel_id && item.fuel_qty && parseFloat(item.fuel_qty) > 0
    ).length;

    const totalQuantity = orderItems.reduce((sum, item) => 
        sum + parseFloat(item.fuel_qty || '0'), 0
    );

    return (
        <div className={`border rounded-lg p-4 max-w-4xl mx-auto transition-all duration-200 ${isValid 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Vehicles: </span>
                        <span className="font-medium">{orderItems.length}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground">Complete: </span>
                        <span className="font-medium">
                            {completeItems}/{orderItems.length}
                        </span>
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">
                            {totalQuantity.toFixed(1)}L
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
    );
}
