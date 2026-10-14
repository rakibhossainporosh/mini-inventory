import React, { InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

export default function FormField({
    label,
    id,
    error,
    helperText,
    required,
    className = '',
    ...props
}: FormFieldProps) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={id}
                className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
            >
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    required={required}
                    className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-2xs transition-all duration-150 focus:outline-hidden ${
                        error
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/20'
                            : 'border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15'
                    } ${className}`}
                    {...props}
                />
            </div>
            {helperText && !error && (
                <p className="text-xs text-slate-500">{helperText}</p>
            )}
            {error && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}