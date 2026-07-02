import type { ReactNode } from "react";
import { getServerEnv } from "@/env/server";
import { WebFooter } from "@/lib/components/web-footer";
import { AppStatusProvider } from "@/lib/providers/app-status.provider";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { WebHeader } from "./_components/web-header";

export default async function WebLayout({ children }: { children: ReactNode }) {
  const session = await userSession();

  const isRegisterClose = !getServerEnv().REGISTRATION_IS_CLOSED;
  return (
    <AppStatusProvider isRegisterClose={isRegisterClose}>
      <div className="flex min-h-screen flex-col w-full">
        <WebHeader session={session} />
        <main className="flex-1 w-full pt-20">{children}</main>
        <WebFooter />
      </div>
    </AppStatusProvider>
  );
}
