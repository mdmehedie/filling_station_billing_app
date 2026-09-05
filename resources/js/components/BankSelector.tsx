import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import banksData from '../../data/banks.json';

interface Bank {
    BankName: string;
    BankShortCode: string;
    Type: string;
}

interface BankSelectorProps {
    selectedBank: string;
    onBankSelect: (bankName: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

export default function BankSelector({
    selectedBank,
    onBankSelect,
    placeholder = "Select sender bank...",
    className,
    error
}: BankSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const banks = banksData as Bank[];

    const filteredBanks = banks.filter(bank => 
        bank.BankName.toLowerCase().includes(searchValue.toLowerCase()) ||
        bank.BankShortCode.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Reset selected index when filtered banks change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchValue]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
                return;
            }
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev < filteredBanks.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev > 0 ? prev - 1 : filteredBanks.length - 1
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredBanks[selectedIndex]) {
                handleSelection(filteredBanks[selectedIndex].BankName);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
        }
    };

    const handleSelection = (bankName: string) => {
        onBankSelect(bankName);
        setOpen(false);
        setSearchValue('');
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between h-10 font-normal",
                            !selectedBank && "text-muted-foreground",
                            error && "border-destructive"
                        )}
                        onKeyDown={handleKeyDown}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Landmark className="h-4 w-4 shrink-0 opacity-50" />
                            <span className="truncate">
                                {selectedBank ? selectedBank : placeholder}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="flex flex-col h-full max-h-[300px]">
                        <div className="flex items-center border-b px-3 sticky top-0 bg-popover z-10">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search bank..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {filteredBanks.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No bank found.
                                </div>
                            ) : (
                                <div className="p-1">
                                    {filteredBanks.map((bank, index) => {
                                        const isSelected = index === selectedIndex;
                                        const isActive = selectedBank === bank.BankName;
                                        
                                        return (
                                            <div
                                                key={`${bank.BankName}-${index}`}
                                                onClick={() => handleSelection(bank.BankName)}
                                                className={cn(
                                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                                    isSelected && "bg-accent text-accent-foreground",
                                                    isActive && "bg-accent/50"
                                                )}
                                            >
                                                <div className="flex flex-col flex-1 truncate">
                                                    <span className="font-medium truncate">{bank.BankName}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {bank.Type} {bank.BankShortCode && `• ${bank.BankShortCode}`}
                                                    </span>
                                                </div>
                                                {isActive && (
                                                    <Check className="ml-auto h-4 w-4 opacity-100" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
