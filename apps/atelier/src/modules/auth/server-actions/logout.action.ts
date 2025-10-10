'use server';

import { redirect } from "next/navigation";
import authService from "../auth.service";
import { deleteUserSession } from "./user-session.action";

export const logoutServerAction = async () => {
   await Promise.allSettled([
    authService.logout(),
    deleteUserSession(),
   ]);
   redirect('/auth/login');
}