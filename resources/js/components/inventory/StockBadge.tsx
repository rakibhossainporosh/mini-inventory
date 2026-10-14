import React from 'react';

interface StockBadgeProps {
    quantity: number;
    className?: string;
}

export default function StockBadge({ quantity, className = '' }: StockBadgeProps) {
    if (quantity === 0) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
            >
                <span className="size-1.5 rounded-full bg-rose-500" />
                Out of Stock (0)
            </span>
        );
    }

    if (quantity < 10) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
            >
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Low Stock ({quantity})
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            In Stock ({quantity})
        </span>
    );
}
