import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { FinishSetupDialog } from "./__components/finish-setup-dialog";
const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <>
  <FinishSetupDialog user={userAuth} />
  {children}</>;
};

export default AdminLayout;

