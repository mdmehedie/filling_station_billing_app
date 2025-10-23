interface DraftOrderItem {
    id: string;
    organization_id: string;
    vehicle_id: string;
    fuel_id: string;
    fuel_qty: string;
    total_price: number;
    per_ltr_price: number;
}

interface DraftOrder {
    sold_date: string;
    organization_id: string;
    order_items: DraftOrderItem[];
    created_at: number;
}

const DRAFT_CACHE_KEY = 'fsbm_order_drafts';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

interface DraftCache {
    [date: string]: DraftOrder;
}

export const draftCache = {
    // Save draft order to localStorage for specific date
    saveDraft: (draft: Omit<DraftOrder, 'created_at'>) => {
        const draftWithTimestamp: DraftOrder = {
            ...draft,
            created_at: Date.now()
        };
        
        try {
            const existingDrafts = draftCache.getAllDrafts();
            existingDrafts[draft.sold_date] = draftWithTimestamp;
            localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(existingDrafts));
            return true;
        } catch (error) {
            console.error('Failed to save draft:', error);
            return false;
        }
    },

    // Load all drafts from localStorage
    getAllDrafts: (): DraftCache => {
        try {
            const stored = localStorage.getItem(DRAFT_CACHE_KEY);
            if (!stored) return {};
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to load drafts:', error);
            return {};
        }
    },

    // Load draft order from localStorage for specific date
    loadDraft: (date: string): DraftOrder | null => {
        try {
            const drafts = draftCache.getAllDrafts();
            const draft = drafts[date];
            
            if (!draft) return null;
            
            // Check if cache is expired
            if (Date.now() - draft.created_at > CACHE_DURATION) {
                draftCache.clearDraftForDate(date);
                return null;
            }

            return draft;
        } catch (error) {
            console.error('Failed to load draft:', error);
            return null;
        }
    },

    // Load draft for specific date (alias for loadDraft)
    loadDraftForDate: (date: string): DraftOrder | null => {
        return draftCache.loadDraft(date);
    },

    // Clear specific draft from localStorage
    clearDraft: (date: string) => {
        try {
            const drafts = draftCache.getAllDrafts();
            delete drafts[date];
            localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(drafts));
            return true;
        } catch (error) {
            console.error('Failed to clear draft:', error);
            return false;
        }
    },

    // Clear all drafts from localStorage
    clearAllDrafts: () => {
        try {
            localStorage.removeItem(DRAFT_CACHE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear all drafts:', error);
            return false;
        }
    },

    // Clear draft for specific date (alias for clearDraft)
    clearDraftForDate: (date: string) => {
        return draftCache.clearDraft(date);
    },

    // Check if draft exists for date
    hasDraftForDate: (date: string): boolean => {
        const draft = draftCache.loadDraft(date);
        return draft !== null;
    },

    // Update draft items for specific date
    updateDraftItems: (items: DraftOrderItem[], soldDate: string, organizationId: string) => {
        const draft: Omit<DraftOrder, 'created_at'> = {
            sold_date: soldDate,
            organization_id: organizationId,
            order_items: items
        };
        return draftCache.saveDraft(draft);
    },

    // Get all available draft dates
    getDraftDates: (): string[] => {
        const drafts = draftCache.getAllDrafts();
        return Object.keys(drafts).filter(date => {
            const draft = drafts[date];
            return draft && (Date.now() - draft.created_at <= CACHE_DURATION);
        });
    },

    // Clean up expired drafts
    cleanupExpiredDrafts: () => {
        try {
            const drafts = draftCache.getAllDrafts();
            const now = Date.now();
            const cleanedDrafts: DraftCache = {};
            
            Object.keys(drafts).forEach(date => {
                const draft = drafts[date];
                if (draft && (now - draft.created_at <= CACHE_DURATION)) {
                    cleanedDrafts[date] = draft;
                }
            });
            
            localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(cleanedDrafts));
            return true;
        } catch (error) {
            console.error('Failed to cleanup expired drafts:', error);
            return false;
        }
    }
};

export type { DraftOrderItem, DraftOrder };
