'use client'

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Search, X } from "lucide-react";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

export function MediaSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.get('search') ?? '';
    const [value, setValue] = useState(currentSearch);
    const [isPending, startTransition] = useTransition();

    const navigate = (search: string) => {
        const trimmed = search.trim();
        const params: Record<string, string> = {};
        if (trimmed) params.search = trimmed;

        const perPage = searchParams.get('per_page');
        if (perPage) params.per_page = perPage;

        startTransition(() => {
            router.push(queryParamBuilder('/atelier/media', params));
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(value);
    };

    const handleClear = () => {
        setValue('');
        navigate('');
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
                type="text"
                placeholder="Search media…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-8 pr-8 h-9 text-xs"
                disabled={isPending}
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </form>
    );
}
