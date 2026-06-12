import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider";
import usersService from "@/modules/users/users.service";
import { Step3Client } from "./step3-client";

export default async function Step3() {
  const user = await userSession();
  if (!user) {
    redirect("/");
  }
  const userCategories = await usersService.getAllCategories(user.id);

  return (
    <UpdateCategoriesProvider userCategories={userCategories.data || []}>
      <Step3Client />
    </UpdateCategoriesProvider>
  );
}
