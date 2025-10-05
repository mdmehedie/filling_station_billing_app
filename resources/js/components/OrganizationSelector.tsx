import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Organization } from '@/types/response';

interface OrganizationSelectorProps {
    organizations: Organization[];
    selectedOrganization: Organization | null;
    onOrganizationSelect: (organization: Organization | null) => void;
    placeholder?: string;
    className?: string;
}

export default function OrganizationSelector({
    organizations,
    selectedOrganization,
    onOrganizationSelect,
    placeholder = "Select organization...",
    className
}: OrganizationSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const filteredOrganizations = organizations.filter(org => 
        org.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        org.name_bn.includes(searchValue) ||
        org.ucode.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <div className={cn("space-y-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12"
                    >
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                                {selectedOrganization ? (
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{selectedOrganization.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedOrganization.name_bn} • {selectedOrganization.ucode}
                                        </span>
                                    </div>
                                ) : (
                                    placeholder
                                )}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="mt-2 max-h-60 overflow-y-auto">
                            {filteredOrganizations.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No organization found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredOrganizations.map((organization) => (
                                        <div
                                            key={organization.id}
                                            onClick={() => {
                                                console.log('Selecting organization:', organization);
                                                onOrganizationSelect(organization);
                                                setOpen(false);
                                                setSearchValue('');
                                            }}
                                            className="flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-2 rounded-sm"
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{organization.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {organization.name_bn} • {organization.ucode}
                                                </span>
                                            </div>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    selectedOrganization?.id === organization.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
