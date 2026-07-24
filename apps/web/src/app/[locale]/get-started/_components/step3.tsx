import type { CategoryBase } from "@repo/common-lib/types/category";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { Step3Client } from "./step3-client";

export default async function Step3() {
  const user = await userSession();
  if (!user) {
    redirect("/");
  }
  const userCategories = await usersService.getAllCategories(user.id);
  const all: CategoryBase[] = userCategories.data || [];
  const disciplineCategories = all.filter((c) => c.type === "DISCIPLINE");
  const styleCategories = all.filter((c) => c.type === "ART_STYLE");

  return (
    <Step3Client
      disciplineCategories={disciplineCategories}
      styleCategories={styleCategories}
    />
  );
}
