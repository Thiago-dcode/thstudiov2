import { userSession } from "@/modules/auth/server-actions/get-user-auth.action";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {

  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <div>{children}</div>;
};

export default AdminLayout;

