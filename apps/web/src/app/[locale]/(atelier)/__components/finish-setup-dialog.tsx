"use client";

import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { Button } from "@repo/ui/components/shadcn/button";
import {
 Dialog,
 DialogContent,
 DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
 ButtonFinishFunnel,
 ContainerFormFunnel,
 FunnelProvider,
} from "@/app/[locale]/get-started/_components/funnel.provider";
import type { UserAuth } from "@/modules/auth/auth.types";

export const FinishSetupDialog = ({ user }: { user: UserAuth }) => {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 console.log(user.funnel_step, FUNNEL_LAST_STEP);
 if (!mounted || user.funnel_step > FUNNEL_LAST_STEP) return null;
 return (
 <Dialog open={user.funnel_step <= FUNNEL_LAST_STEP}>
 <DialogContent className="max-w-md p-8">
 <div className="flex flex-col items-center gap-6 text-center">
 <DialogTitle className="text-2xl font-semibold">
 Complete Your Profile
 </DialogTitle>
 <p className="text-text-muted">
 You're almost there! Complete your profile setup to unlock all
 features and get the best experience.
 </p>

 <Button
 asChild
 variant="default"
 className="w-full font-bold"
 >
 <Link
 href={"/get-started"}
 className="flex items-center justify-center gap-2"
 >
 Continue Setting Up <ArrowRight className="size-4" />
 </Link>
 </Button>

 <FunnelProvider
 defaultCanContinue={true}
 user={user}
 lastStep={FUNNEL_LAST_STEP}
 >
 <ContainerFormFunnel>
 <ButtonFinishFunnel text="Skip for now" />
 </ContainerFormFunnel>
 </FunnelProvider>
 </div>
 </DialogContent>
 </Dialog>
 );
};
