import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


export function currenyFormat(amount: number) {
    // international currency formater
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export function numberFormat(amount: number) {
    // Format large numbers with K, M, B suffixes
    const absAmount = Math.abs(amount);
    let formattedNumber: string;
    
    if (absAmount >= 1_000_000_000) {
        formattedNumber = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (absAmount >= 1_000_000) {
        formattedNumber = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (absAmount >= 1_000) {
        formattedNumber = (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {    

        formattedNumber = amount.toString();
    }
    
    return formattedNumber;
} 