import React, { useState, useEffect, useRef } from 'react';
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
    onFocus?: () => void;
    onBlur?: () => void;
    isOpenOnFocus?: boolean;
}

export default function OrganizationSelector({
    organizations,
    selectedOrganization,
    onOrganizationSelect,
    placeholder = "Select organization...",
    className,
    onFocus,
    onBlur,
    isOpenOnFocus = false
}: OrganizationSelectorProps) {
    const [open, setOpen] = useState(isOpenOnFocus);
    const [searchValue, setSearchValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredOrganizations = organizations.filter(org => 
        org.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        org.name_bn.includes(searchValue) ||
        org.ucode.toLowerCase().includes(searchValue.toLowerCase())
    );


    // Reset selected index when filtered organizations change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchValue]);

    // Scroll selected item into view
    useEffect(() => {
        if (open && filteredOrganizations.length > 0) {
            const selectedElement = document.querySelector(`[data-org-item="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, open]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
    }, [open]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
                return;
            }
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex(prev => 
                prev < filteredOrganizations.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex(prev => 
                prev > 0 ? prev - 1 : filteredOrganizations.length - 1
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (filteredOrganizations[selectedIndex]) {
                handleSelection(filteredOrganizations[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
        } else if (e.key === 'Tab') {
            // Don't close dropdown on Tab, let form handle navigation
            return;
        }
    };

    // Handle focus to auto-open dropdown
    const handleFocus = () => {
        // setOpen(true);
        // Focus will be handled by useEffect when open changes
        // Don't call onFocus here - only call it after actual selection
    };

    // Custom close function for selection
    const handleSelection = (organization: Organization) => {
        onOrganizationSelect(organization);
        setOpen(false);
        setSearchValue('');
        // onFocus will be called from the parent component after selection
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
            }}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12"
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={(e) => {
                            // Don't close dropdown on blur, only on explicit selection
                            e.preventDefault();
                            onBlur?.();
                        }}
                        data-organization-selector
                        data-organization-trigger
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
                <PopoverContent className="w-full p-0" align="start" data-organization-dropdown>
                    <div className="p-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search organizations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => {
                                    // Handle keyboard navigation in search input
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedIndex(prev => 
                                            prev < filteredOrganizations.length - 1 ? prev + 1 : 0
                                        );
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedIndex(prev => 
                                            prev > 0 ? prev - 1 : filteredOrganizations.length - 1
                                        );
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (filteredOrganizations[selectedIndex]) {
                                            handleSelection(filteredOrganizations[selectedIndex]);
                                        }
                                    } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpen(false);
                                    } else if (e.key === 'Tab') {
                                        // Let Tab work normally for form navigation
                                        // Don't prevent default - let it bubble up to form handler
                                    }
                                }}
                                className="pl-8"
                                data-search-input
                                autoFocus
                            />
                        </div>
                        <div className="mt-2 max-h-60 overflow-y-auto">
                            {filteredOrganizations.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No organization found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredOrganizations.map((organization, index) => {
                                        const isSelected = index === selectedIndex;
                                        
                                        return (
                                            <div
                                                key={organization.id}
                                                data-org-item={index}
                                                onClick={() => {
                                                    handleSelection(organization);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-2 rounded-sm transition-colors",
                                                    isSelected && "bg-blue-100 text-blue-900 font-medium dark:bg-blue-900 dark:text-blue-100"
                                                )}
                                                style={{
                                                    backgroundColor: isSelected ? '#dbeafe' : undefined,
                                                    color: isSelected ? '#1e3a8a' : undefined,
                                                    fontWeight: isSelected ? '600' : undefined
                                                }}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">{organization.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {organization.name_bn} • {organization.ucode}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {index === selectedIndex && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    )}
                                                    <Check
                                                        className={cn(
                                                            "ml-auto h-4 w-4",
                                                            selectedOrganization?.id === organization.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
