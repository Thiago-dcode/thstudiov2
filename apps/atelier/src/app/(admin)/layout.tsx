import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <div>{children}</div>;
};

export default AdminLayout;

