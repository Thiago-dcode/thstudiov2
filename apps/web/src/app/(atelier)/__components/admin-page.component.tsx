import Link from "next/link";
import { ExternalLink } from "lucide-react";

type AdminPageContainerProps = {
    children: React.ReactNode;
};

export const AdminPageContainer = ({ children }: AdminPageContainerProps) => {
    return (
        <section className="size-full p-4 overflow-auto">
            {children}
        </section>
    );
};

type AdminPageTitleProps = {
    title: string;
    publicHref?: string;
    children?: React.ReactNode;
};

export const AdminPageTitle = ({ title, publicHref, children }: AdminPageTitleProps) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{title}</h1>
                {publicHref && (
                    <Link
                        href={publicHref}
                        rel="noopener noreferrer"
                        aria-label="View public page"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="size-4" />
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
};