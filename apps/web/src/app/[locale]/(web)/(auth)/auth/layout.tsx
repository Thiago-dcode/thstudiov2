import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AuthLayout({ children }: { children: ReactNode }) {

  const userAuth = await userSession();

  if (userAuth) {
    redirect('/')
  }

  return (
    <>
      {children}
    </>
  );
}
