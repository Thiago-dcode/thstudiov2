import { cn } from "@repo/ui/lib/utils";
import { ReactNode } from "react";

const Container = ({ children, className }: {
    children: ReactNode
    className?: string
}) => {
    return (
        <div className={cn(
            "mx-auto w-full max-w-(--screen-desktop) px-6 py-4 md:px-12 tablet:py-8 animate-in fade-in duration-1000",
            className
        )}>
            {children}
        </div>
    );
};

const Header = ({ title, description }: { title: string; description?: string }) => {
    return (
        <header className="mb-10 md:mb-16 flex flex-col items-start gap-6 border-b border-border/40 pb-6">
            <div className="max-w-2xl space-y-2">
                <h1 className="text-3xl font-serif italic tracking-tight tablet:text-5xl desktop:text-6xl">
                    {title}
                </h1>
                {description && (
                    <p className="max-w-xl text-base leading-relaxed text-text-muted md:text-lg">
                        {description}
                    </p>
                )}
            </div>
        </header>
    );
}

export default {
    Container,
    Header
};
