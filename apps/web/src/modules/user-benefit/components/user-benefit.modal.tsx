'use client'

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getUserBenefitAction } from "../server-actions/get-user-benefit.action"
import { useEffect, useState } from "react";
import { BaseUser, User } from "@repo/common-lib/types/user";
import { UserAuth } from "@repo/common-lib/types/auth";
import { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { EnumType } from "@repo/common-lib/constants/enums";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BENEFIT_CONFIG: Record<EnumType<'BENEFIT_TYPE'>, { label: string; months: number }> = {
    EARLY_USER: { label: 'Early User', months: 3 },
    VIP: { label: 'VIP', months: 6 },
};

export const UserBenefitModal = ({ user, subscriptionPath }: { user: User | BaseUser | UserAuth, subscriptionPath?: string }) => {
    const [userBenefit, setUserBenefit] = useState<BenefitWithRedeemed | null>(null);
    const [open, setOpen] = useState(false);

    const pathname = usePathname();

   

    const { handleAction } = useHandleAction({
        action: async () => {
            return await getUserBenefitAction(user.id);
        },
        afterAction: async (result) => {
            if (result.data) {
                setUserBenefit(result.data);
            }
        }
    });

    useEffect(() => {
        if (userBenefit) return;

        if ('benefit' in user && user.benefit !== null) {
            setUserBenefit(user.benefit);
            return;
        }
        handleAction();
    }, [user, userBenefit]);

    useEffect(() => {
        if (userBenefit) setOpen(true);
    }, [userBenefit]);

    if (!userBenefit || userBenefit.redeemed || pathname === subscriptionPath) return null;

    const config = BENEFIT_CONFIG[userBenefit.type] ?? {
        label: userBenefit.type,
        months: Math.round(userBenefit.trial_days / 30),
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md p-8">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <Gift className="size-8 text-primary" />
                    </div>

                    <DialogHeader className="items-center gap-2">
                        <DialogTitle className="text-2xl font-semibold">
                            You have a gift waiting
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            As a <span className="font-semibold text-foreground">{config.label}</span> you
                            get{' '}
                            <span className="font-semibold text-primary">
                                {config.months} months free
                            </span>{' '}
                            on any plan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-left text-sm text-muted-foreground">
                        <Sparkles className="size-5 shrink-0 text-primary" />
                        <span>
                            Your benefit will be applied automatically when you choose a plan &mdash; no
                            code needed.
                        </span>
                    </div>

                    {subscriptionPath ? (
                        <div className="flex w-full flex-col gap-2">
                            <Button asChild variant="default" className="w-full rounded-xl font-bold">
                                <Link href={subscriptionPath} className="flex items-center justify-center gap-2">
                                    Choose a plan <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full rounded-xl text-muted-foreground"
                                onClick={() => setOpen(false)}
                            >
                                Maybe later
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="default"
                            className="w-full rounded-xl font-bold"
                            onClick={() => setOpen(false)}
                        >
                            Got it, thanks!
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
