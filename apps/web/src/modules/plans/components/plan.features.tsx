'use client'
import { BasePlan } from "@repo/common-lib/types/plan";
import { CircleCheck, Info, X } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui/components/shadcn/hover-card";
import { cn } from "@repo/ui/lib/utils";

export  const PlanFeatures = ({ plan }: {
    plan: BasePlan
  }) => {
    // Format megabytes to GB
    const formatMegaBytes = (megabytes: number): string => {
      return `${(megabytes / 1024).toFixed(1)} GB`;
    };
    // Format feature value
    const formatFeatureValue = (value: number | boolean): string | number | boolean => {
      if (typeof value === 'boolean') return value; // Keep boolean as is
      if (value === -1) return "Unlimited";
      return value;
    };
    const features: {
      content: string | ReactNode,
      not_available?: boolean,
      highlight?: boolean,
      extraInfo?: string
    }[] = useMemo(() => [
      { content: <p><span className="font-bold">{formatMegaBytes(plan.max_media_size)}</span> of media storage</p>} ,
      { content: <p><span className="font-bold">{formatFeatureValue(plan.max_projects)}</span> Projects</p>} ,
      { content: <p><span className="font-bold">{formatFeatureValue(plan.max_portfolios)}</span> Portfolios</p>} ,
      { content: <p><span className="font-bold">{formatFeatureValue(plan.max_services)}</span> Services</p>, },
      { content: <p><span className="font-bold">{formatFeatureValue(plan.max_clients)}</span> Clients</p>, },
      { content: <p className={cn(plan.allow_media_compression && "bg-secondary rounded-2xl text-secondary-fg px-2 ")}>{plan.allow_media_compression?'⚡': ''}Media compression</p>, not_available: !plan.allow_media_compression, extraInfo: "Choose your preferred compression level when uploading photos. Balance between image quality and file size to optimize your storage and loading times." },
      { content: <p className={cn(plan.ai_credits > 0 && "bg-accent rounded-2xl text-accent-fg px-2 ")}>🧠<span className="font-bold">{formatFeatureValue(plan.ai_credits)}</span> AI Credits</p>, not_available: plan.ai_credits === 0, extraInfo: 'Leverage AI to automate repetitive tasks. Automatically generate titles, descriptions, and tags for your media based on content analysis, saving you time and effort.' },
    ]
      , [plan])
    return ( 
      <ul className="flex flex-col gap-3 w-full ">
        {features.map((feature, index) => {
         
  
          return (
            <li key={index} className={`group flex items-center justify-start gap-4 transition-colors hover:bg-fg-1/10 p-1 text-sm lg:text-base ${feature?.not_available ? 'opacity-50' : ''}`}>
              {feature?.not_available? <X/>: <CircleCheck/>}
             {typeof feature.content ==='string'? <span className="text-text ">{feature.content}</span>: <>{feature.content}</>}
              {feature.extraInfo && <HoverCard openDelay={200}>
                <HoverCardTrigger><Info className="w-4" /></HoverCardTrigger>
                <HoverCardContent>
                  {feature.extraInfo}
                </HoverCardContent>
              </HoverCard>}
            </li>
          );
        })}
      </ul>)
  
  
  }