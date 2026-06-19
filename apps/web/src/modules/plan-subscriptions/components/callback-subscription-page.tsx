"use client";

import { cn } from "@repo/ui/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";
import PageComponent from "@/lib/components/page-component";
import { deleteInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";

export function CallbackSubscriptionPage({
 isSuccess,
 title,
 subtitle,
 children,
 className,
}: {
 isSuccess: boolean;
 title: string;
 subtitle: string;
 children: React.ReactNode;
 className?: string;
}) {
 useEffect(() => {
 deleteInitiateSubscriptionCookie();
 }, []);

 return (
 <PageComponent.Container
 className={cn("flex items-center justify-center m-auto", className)}
 >
 <PageComponent.Content className="self-center w-full max-w-md gap-12 p-10">
 <PageComponent.Header>
 <div className="flex flex-col items-center gap-8 text-center">
 <div
 className="flex size-16 shrink-0 items-center justify-center"
 aria-hidden
 >
 {isSuccess ? (
 <CheckCircle2
 className="size-8 text-text-muted"
 strokeWidth={1}
 />
 ) : (
 <XCircle className="size-8 text-text-muted" strokeWidth={1} />
 )}
 </div>
 <div className="space-y-4">
 <h1 className="font-serif text-3xl text-text">{title}</h1>
 <p className="text-text-muted leading-relaxed font-serif">
 {subtitle}
 </p>
 </div>
 </div>
 </PageComponent.Header>
 <div className="flex flex-col gap-4 w-full">{children}</div>
 </PageComponent.Content>
 </PageComponent.Container>
 );
}
