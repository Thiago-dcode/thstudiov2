import type { ReactNode } from "react";
import { redirect } from "@/i18n/redirect";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userAuth = await userSession();

  if (userAuth) {
    await redirect("/");
    return;
  }

  return <>{children}</>;
}
