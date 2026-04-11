import { ReactNode } from "react";
import { WebHeader } from "./_components/web-header";
import { WebFooter } from "@/lib/components/web-footer";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export default async function WebLayout({ children }: { children: ReactNode }) {
  const session = await userSession();

  return (
    <div className="flex min-h-screen flex-col w-full">
      <WebHeader session={session} />
      <main className="flex-1 w-full pt-16">{children}</main>
      <WebFooter />
    </div>
  );
}
