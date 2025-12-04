import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { ScrollArea } from '@repo/ui/components/shadcn/scroll-area'
const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <ScrollArea >{children}</ScrollArea >;
};

export default AdminLayout;

