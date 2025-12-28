import { userSession } from "@/modules/auth/server-actions/user-session.action"
import usersService from "@/modules/users/users.service"
import { redirect } from "next/navigation";
import { Step3Client } from "./step3-client";
import { UpdateCategoriesProvider } from "@/modules/categories/providers/update-user-categories.provider";

export default async function Step3() {
    const user = await userSession();
    if (!user) {
        redirect('/')
    }
    const userCategories = await usersService.getAllCategories(user.id);

    return <UpdateCategoriesProvider userCategories={userCategories.data || []}><Step3Client  />
</UpdateCategoriesProvider>}