import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, AlertCircle, X } from "lucide-react";
import { draftCache, DraftOrder } from "@/lib/draftCache";

interface DraftManagerProps {
    currentDate: string;
    onDraftCleared: (date: string) => void;
    onDraftSelected: (date: string) => void;
}

export default function DraftManager({ 
    currentDate, 
    onDraftCleared, 
    onDraftSelected 
}: DraftManagerProps) {
    const [drafts, setDrafts] = useState<{ [date: string]: DraftOrder }>({});
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadDrafts();
    }, []);

    const loadDrafts = () => {
        const allDrafts = draftCache.getAllDrafts();
        setDrafts(allDrafts);
    };

    const clearDraft = (date: string) => {
        if (window.confirm(`Are you sure you want to clear the draft for ${new Date(date).toLocaleDateString()}?`)) {
            draftCache.clearDraftForDate(date);
            loadDrafts();
            onDraftCleared(date);
        }
    };

    const clearAllDrafts = () => {
        const draftDates = Object.keys(drafts);
        if (draftDates.length === 0) return;
        
        if (window.confirm(`Are you sure you want to clear all ${draftDates.length} drafts?`)) {
            draftCache.clearAllDrafts();
            loadDrafts();
            onDraftCleared('all');
        }
    };

    const selectDraft = (date: string) => {
        onDraftSelected(date);
        setIsOpen(false);
    };

    const draftDates = Object.keys(drafts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const currentDraft = drafts[currentDate];

    if (draftDates.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Draft Indicator Button */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2"
            >
                <Calendar className="h-4 w-4" />
                <span>Drafts ({draftDates.length})</span>
                {currentDraft && (
                    <Badge variant="secondary" className="ml-1">
                        Current
                    </Badge>
                )}
            </Button>

            {/* Draft Manager Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">Saved Drafts</h3>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {draftDates.map(date => {
                                const draft = drafts[date];
                                const isCurrent = date === currentDate;
                                const itemCount = draft.order_items.length;
                                
                                return (
                                    <div
                                        key={date}
                                        className={`p-3 rounded-lg border transition-colors ${isCurrent 
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
                                            : 'bg-muted/50 hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {new Date(date).toLocaleDateString()}
                                                    </span>
                                                    {isCurrent && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {itemCount} vehicle{itemCount !== 1 ? 's' : ''} • 
                                                    Saved {new Date(draft.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!isCurrent && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => selectDraft(date)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        Load
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => clearDraft(date)}
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {draftDates.length > 1 && (
                            <div className="mt-3 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={clearAllDrafts}
                                    className="w-full flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear All Drafts
                                </Button>
                            </div>
                        )}

                        <div className="mt-3 text-xs text-muted-foreground text-center">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Drafts auto-expire after 2 hours
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
