"use client";

import { Timer } from "@repo/ui/components/custom/Timer";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const TryAgainButton = ({ nextAttempt }: { nextAttempt: number }) => {
 const route = useRouter();
 return (
 <>
 {nextAttempt <= 0 ? (
 <Link
 href="/auth/password-recovery"
 className="block text-center w-full px-4 py-3 bg-text hover:bg-text-muted text-bg font-semibold transition-colors"
 >
 Try again
 </Link>
 ) : (
 <div className="cursor-not-allowed flex items-center justify-center gap-2 text-sm text-center w-full px-4 py-3 bg-text/50 text-bg font-semibold transition-colors">
 Try again in{" "}
 <Timer
 expiresIn={nextAttempt}
 options={{
 onFinish: async () => {
 route.refresh();
 },
 }}
 />
 </div>
 )}
 </>
 );
};
