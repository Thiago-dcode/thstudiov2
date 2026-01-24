import usersService from "@/modules/users/users.service"
import { cn } from "@repo/ui/lib/utils";
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover"
import { PlanFeatures } from "@/modules/plans/components/plan.features"
import { Eye } from "lucide-react";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export const UserMetricsSkeleton = () => {
    return (
        <section className="w-full flex flex-col gap-2 items-start justify-start">
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="flex items-center justify-start gap-3 w-full flex-wrap">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={`skeleton-${i}`}
                        className="flex flex-col items-center justify-center h-full gap-2 min-w-28 max-h-22 shadow-md shadow-fg-1 rounded-md p-1 bg-fg-1"
                    >
                        <Skeleton className="h-14 w-16" />
                    </div>
                ))}
            </div>
        </section>
    );
};

export const UserMetrics = async ({ userId }: {
    userId: number
}) => {

    const metricsResult = await usersService.metrics(userId);
    if (!metricsResult.data) return <div>No data available</div>;

    const { extra_data, active_plan } = metricsResult.data;
    const { clients_count, media_count, media_size, portfolios_count, projects_count, services_count,ai_credits,ai_credits_consumed } = extra_data;
    const { max_clients, max_media_size, max_portfolios, max_projects, max_services, translation, name,ai_credits: plan_ai_credits } = active_plan;

    const METRICS: {
        title: string,
        used: number,
        limit: number,
        format?: (used: number, limit: number) => string
    }[] = [
            {
                title: 'Media',
                used: media_count,
                limit: -1,
            },
            {
                title: 'Storage',
                used: media_size,
                limit: max_media_size,
                format: (used, limit) => `${(used / 1024).toFixed(1)} / ${(limit / 1024).toFixed(0)} GB`,
            },
            {
                title: 'Clients',
                used: clients_count,
                limit: max_clients,
            },

            {
                title: 'Portfolios',
                used: portfolios_count,
                limit: max_portfolios,
            },
            {
                title: 'Projects',
                used: projects_count,
                limit: max_projects,
            },
            {
                title: 'Services',
                used: services_count,
                limit: max_services,
            },
            {
                title: 'Ai Credits',
                used: ai_credits_consumed,
                limit: ai_credits + plan_ai_credits,
            },
        ]
    const getPercentage = (used: number, limit: number) => {
        if (limit === Infinity || limit === 0) return 0;
        return Math.min((used / limit) * 100, 100);
    }

    return <section className="w-full flex flex-col gap-2 items-start justify-start">
        <Popover>
            <PopoverTrigger>
                <Badge className="w-fit flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <span>{translation?.name || name} Plan</span> <Eye size={14} />
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-fg-1/90">
                <PlanFeatures plan={active_plan} />
            </PopoverContent>
        </Popover>
        <div className="flex items-center justify-start gap-3 w-full  flex-wrap">

            {METRICS.map(({ title, used, limit, format }, i) => {
                const percentage = used ===limit ?100: getPercentage(used , limit);
               
                const displayValue = format
                    ? format(used, limit)
                    : limit === -1
                        ? `${used}`
                        : `${used} / ${limit}`;

                return (
                    <div key={`${title}-${i}`} className={cn("flex flex-col items-center justify-center h-full gap-2 min-w-28 max-h-22  shadow-md shadow-fg-1 rounded-md p-1", {
                        "bg-emerald-700": percentage < 50,
                        "bg-amber-700": percentage >= 50 && percentage < 75,
                        "bg-red-700": percentage >= 75,
                        "bg-accent-muted/80": limit === -1
                    })}>
                        <p className="text-center text-sm text-muted-foreground">{title}</p>

                        <p className="font-bold text-lg">{displayValue}</p>


                    </div>
                )
            })}
        </div>
    </section>

}