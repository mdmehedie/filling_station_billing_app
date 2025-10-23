import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface OrderItemHeaderProps {
    index: number;
    isComplete: boolean;
    canRemove: boolean;
    onRemove: () => void;
}

export default function OrderItemHeader({
    index,
    isComplete,
    canRemove,
    onRemove
}: OrderItemHeaderProps) {
    return (
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
            {canRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
