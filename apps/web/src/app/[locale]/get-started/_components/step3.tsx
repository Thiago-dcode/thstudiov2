import { MAX_CATEGORIES_USER } from "@repo/common-lib/constants/constants";
import type { CategoryBase } from "@repo/common-lib/types/category";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { GetCategoriesProvider } from "@/modules/categories/providers/getCategories.provider";
import usersService from "@/modules/users/users.service";
import { Step3Client } from "./step3-client";

export default async function Step3() {
  const user = await userSession();
  if (!user) {
    redirect("/");
  }
  const userCategories = await usersService.getAllCategories(user.id);
  const all: CategoryBase[] = userCategories.data || [];

  return (
    <GetCategoriesProvider
      initialCategories={all}
      maxSelections={MAX_CATEGORIES_USER}
    >
      <Step3Client />
    </GetCategoriesProvider>
  );
}
