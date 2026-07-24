import type { ReactNode } from "react";
import { WebFooter } from "@/lib/components/web-footer";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { WebHeader } from "./_components/web-header";

export default async function WebLayout({ children }: { children: ReactNode }) {
  const session = await userSession();

  return (
    <div className="flex min-h-screen flex-col w-full">
      <WebHeader session={session} />
      <main className="flex-1 w-full pt-20 m-w-(--breakpoint-ultrawide)">{children}</main>
      <WebFooter />
    </div>
  );
}
