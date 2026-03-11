import { ReactNode } from "react";
import { WebHeader } from "./_cpmponents/web-header";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export default async function WebLayout({ children }: { children: ReactNode }) {
  const session = await userSession();

  return (
    <div className="flex min-h-screen flex-col w-full">
      <WebHeader session={session} />
      <main className="flex-1 size-full pt-16">{children}</main>
      <footer />
    </div>
  );
}
