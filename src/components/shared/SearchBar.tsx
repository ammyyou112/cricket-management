import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce'; // Assuming hook exists or I will create simple logic here

// Simple debounce hook implementation inline if not found, 
// but sticking to standard "useEffect with timeout" inside component is safer if no hook file exists.

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
    debounceTime?: number;
}

const SearchBar = ({
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    className,
    isLoading = false,
    debounceTime = 500
}: SearchBarProps) => {
    // We use the parent's controlled value.
    // We need to debounce the onSearch call.

    useEffect(() => {
        if (!onSearch) return;

        const timer = setTimeout(() => {
            onSearch(value);
        }, debounceTime);

        return () => clearTimeout(timer);
    }, [value, debounceTime, onSearch]);

    const handleClear = () => {
        onChange('');
        if (onSearch) onSearch(''); // Immediate clear or debounce? Usually clear is immediate.
    };

    return (
        <div className={cn("relative flex items-center", className)}>
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-9 pr-12 focus-visible:ring-offset-0"
                placeholder={placeholder}
            />

            <div className="absolute right-3 flex items-center gap-1">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : value ? (
                    <button
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default SearchBar;
