import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userAuth = await userSession();

  if (userAuth) {
    redirect("/");
  }

  return <>{children}</>;
}
