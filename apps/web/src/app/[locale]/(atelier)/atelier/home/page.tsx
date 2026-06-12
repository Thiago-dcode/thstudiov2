import { notFound, redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import EditUserComponent from "@/modules/users/components/edit-user.component";
import usersService from "@/modules/users/users.service";
import EditUserProvider from "../../../../../modules/users/providers/edit-user.provider";
import { AdminPageContainer } from "../../__components/admin-page.component";

export default async function AtelierHomePage() {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const [userResponse, addressResponse, categoriesResponse] = await Promise.all(
    [
      usersService.getOne(userAuth.id),
      usersService.address(userAuth.id),
      usersService.getAllCategories(userAuth.id),
    ],
  );
  console.log(userResponse);
  if (!userResponse.data) {
    notFound();
  }

  return (
    <EditUserProvider
      defaultAddress={addressResponse.data || undefined}
      defaultUser={userResponse.data}
      defaultUserCategories={categoriesResponse.data || []}
    >
      <AdminPageContainer>
        <EditUserComponent />
      </AdminPageContainer>
    </EditUserProvider>
  );
}
