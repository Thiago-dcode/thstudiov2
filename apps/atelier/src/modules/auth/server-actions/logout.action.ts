'use server';

import { redirect } from "next/navigation";
import authService from "../auth.service";
import { deleteUserSession } from "./get-session.action";

export const logoutServerAction = async () => {
   await Promise.all([
    authService.logout(),
    deleteUserSession(),
   ]);
   redirect('/auth/login');
}