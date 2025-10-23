import { Label } from "@/components/ui/label";
import { Organization } from "@/types/response";
import OrganizationSelector from "@/components/OrganizationSelector";

interface OrderItemOrganizationProps {
    itemId: string;
    organizationId: string;
    organizations: Organization[];
    onOrganizationChange: (organizationId: string) => void;
    onUpdate: (field: keyof { organization_id: string; vehicle_id: string; fuel_id: string; fuel_qty: string; total_price: number; per_ltr_price: number }, value: string | number) => void;
}

export default function OrderItemOrganization({
    itemId,
    organizationId,
    organizations,
    onOrganizationChange,
    onUpdate
}: OrderItemOrganizationProps) {
    return (
        <div className="flex-1 min-w-0">
            <Label className="text-xs font-medium">Organization</Label>
            <div className="w-full">
                <OrganizationSelector
                    organizations={organizations}
                    selectedOrganization={organizations.find(org => org.id.toString() === organizationId) || null}
                    onOrganizationSelect={(org) => {
                        if (org) {
                            onUpdate('organization_id', org.id.toString());
                            onOrganizationChange(org.id.toString());
                            
                            // Focus the vehicle field after organization selection and auto-open
                            setTimeout(() => {
                                const vehicleButton = document.querySelector(`[data-item-id="${itemId}"] [data-vehicle-select]`) as HTMLElement;
                                if (vehicleButton) {
                                    vehicleButton.focus();
                                    // Auto-open the vehicle dropdown
                                    setTimeout(() => vehicleButton.click(), 50);
                                }
                            }, 100);
                        }
                    }}
                    placeholder="Select org"
                />
            </div>
        </div>
    );
}
