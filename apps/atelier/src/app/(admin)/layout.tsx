import { userSession } from "@/modules/auth/server-actions/get-session.action";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const userAuth = await userSession();
  console.log(userAuth);
  if (!userAuth) {
    redirect('/');
  }
  return <div>{children}</div>;
};

export default AdminLayout;

