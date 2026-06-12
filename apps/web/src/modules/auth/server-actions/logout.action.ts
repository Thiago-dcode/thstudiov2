"use server";

import authService from "../auth.service";
import { deleteUserSession } from "./user-session.action";

export const logoutServerAction = async () => {
  try {
    await Promise.allSettled([authService.logout(), deleteUserSession()]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
