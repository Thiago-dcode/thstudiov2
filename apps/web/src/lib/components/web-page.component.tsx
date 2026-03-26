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

const Header = ({
    title,
    description,
    children,
    titleClassName,
}: {
    title: string
    description?: string
    children?: ReactNode
    titleClassName?: string
}) => {
    return (
        <header className="mb-8 desktop:mb-12 flex flex-col items-center gap-6 border-b border-border/40 pb-6">
            <div className="max-w-2xl space-y-2">
                <div className="flex items-baseline gap-4 justify-center">
                    <h1
                        className={cn(
                            "text-3xl font-serif italic tracking-tight tablet:text-5xl desktop:text-6xl",
                            titleClassName,
                        )}
                    >
                        {title}
                    </h1>
                    {children}
                </div>
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
