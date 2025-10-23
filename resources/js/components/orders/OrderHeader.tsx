import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization } from "@/types/response";

interface OrderHeaderProps {
    soldDate: string;
    onSoldDateChange: (value: string) => void;
    organizations: Organization[];
    selectedOrg: Organization | null;
    onOrganizationSelect: (org: Organization | null) => void;
    errors: {
        sold_date?: string;
        organization_id?: string;
    };
}

export default function OrderHeader({
    soldDate,
    onSoldDateChange,
    organizations,
    selectedOrg,
    onOrganizationSelect,
    errors
}: OrderHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Sold Date - At the top */}
            <div className="space-y-2">
                <Label htmlFor="sold_date" className="text-base font-medium">Sold Date *</Label>
                <Input
                    id="sold_date"
                    type="date"
                    value={soldDate}
                    onChange={(e) => onSoldDateChange(e.target.value)}
                    className="h-12"
                />
                {errors.sold_date && (
                    <p className="text-sm text-destructive">{errors.sold_date}</p>
                )}
            </div>

            {/* Organization Selection */}
            <div className="space-y-2">
                <Label className="text-base font-medium">Organization *</Label>
                <OrganizationSelector
                    organizations={organizations}
                    selectedOrganization={selectedOrg}
                    onOrganizationSelect={onOrganizationSelect}
                    placeholder="Select organization"
                />
                {errors.organization_id && (
                    <p className="text-sm text-destructive">{errors.organization_id}</p>
                )}
            </div>
        </div>
    );
}
