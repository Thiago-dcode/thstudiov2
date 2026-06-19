import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { Step4Client } from "./step4-client";

export default async function Step4() {
 //TODO: get user address

 const userAuth = await userSession();
 if (!userAuth) {
 redirect("/");
 }

 const addressResponse = await usersService.address(userAuth.id);

 //Create custom hook to handle api geo autocomplete

 //Create a dropdown component to show the result

 //Display the selected result to the user

 //Update user address with the address selected

 //Handle funnel logic

 return (
 <Step4Client
 userAuth={userAuth}
 defaultAddress={addressResponse.data || undefined}
 />
 );
}
