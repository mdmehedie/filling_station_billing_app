import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard, X } from "lucide-react";

export default function KeyboardShortcutsGuide() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Keyboard Shortcuts</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Keyboard className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Navigation</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Navigate to next field</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Tab</kbd>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Navigate to previous field</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Shift + Tab</kbd>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Move to next field after input</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Dropdown Selection</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Open dropdown</span>
                                        <div className="flex gap-1">
                                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↓</kbd>
                                            <span className="text-xs text-muted-foreground">or</span>
                                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↑</kbd>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Navigate options</span>
                                        <div className="flex gap-1">
                                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↑</kbd>
                                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↓</kbd>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Select option and move to next field</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Close dropdown without selection</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Search in Organization dropdown</span>
                                        <span className="text-xs text-muted-foreground">Just start typing</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Quick Actions</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Add new vehicle</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + Enter</kbd>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="text-sm">Submit form (Create Order)</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Alt + Enter</kbd>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">⚡ 5-Tab Workflow</h3>
                                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                                    <p className="text-base font-semibold mb-2">Just 5 tabs per vehicle!</p>
                                    <p><strong>Tab 1:</strong> Select Date → Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd></p>
                                    <p><strong>Tab 2:</strong> Organization (auto-opens) → <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> navigate, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> select</p>
                                    <p><strong>Tab 3:</strong> Vehicle (auto-opens) → <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> navigate, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> select</p>
                                    <p><strong>Tab 4:</strong> Fuel (auto-opens) → <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> navigate, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> select</p>
                                    <p><strong>Tab 5:</strong> Quantity → Enter amount, press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd></p>
                                    <p className="pt-2 border-t"><strong>Next vehicle:</strong> Auto-adds & focuses Organization field!</p>
                                    <p><strong>Submit:</strong> Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Alt+Enter</kbd> anytime to submit form</p>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                                <p>💡 Tip: You can complete the entire form without touching your mouse!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
