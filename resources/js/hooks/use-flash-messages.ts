import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useToast } from './use-toast';

export function useFlashMessages() {
    const { flash } = usePage().props as any;
    const { toast } = useToast();
    const processedMessages = useRef(new Set<string>());

    useEffect(() => {
        if (flash?.success && !processedMessages.current.has(`success-${flash.success}`)) {
            processedMessages.current.add(`success-${flash.success}`);
            toast({
                title: "Success",
                description: flash.success,
                variant: "success",
            });
        }

        if (flash?.error && !processedMessages.current.has(`error-${flash.error}`)) {
            processedMessages.current.add(`error-${flash.error}`);
            toast({
                title: "Error",
                description: flash.error,
                variant: "destructive",
            });
        }
    }, [flash?.success, flash?.error, toast]);
}
