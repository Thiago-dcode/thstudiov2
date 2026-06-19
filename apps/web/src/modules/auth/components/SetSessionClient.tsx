"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserAuth } from "../auth.types";
import {
 deleteUserSession,
 setUserSession,
} from "../server-actions/user-session.action";

export const SetSessionClient = ({
 userAuth,
 redirect,
}: {
 userAuth: UserAuth;
 redirect: string;
}) => {
 const router = useRouter();
 useEffect(() => {
 deleteUserSession()
 .then(() => {
 setUserSession(userAuth).then(() => {
 router.push(redirect);
 });
 })
 .catch(() => {
 router.push(redirect);
 });
 }, [userAuth, redirect, router.push]);

 return null;
};
