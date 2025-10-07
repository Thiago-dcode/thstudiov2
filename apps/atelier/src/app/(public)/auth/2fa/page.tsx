import { verify2faServerAction } from "@/modules/auth/server-actions/verify2fa-server.action";
import { TWO_FA_COOKIE_NAME } from "@repo/common-lib/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export default async function Login({ searchParams }: { searchParams: Promise<{ "errors[]"?: string[] }> }) {
  const { "errors[]": errors } = await searchParams;
  console.log("errors", errors);
  const cookieStore = await cookies();
  const email = cookieStore.get(TWO_FA_COOKIE_NAME)?.value;
  if(!email){
    redirect('/auth/login');
  }
  return <form action={verify2faServerAction}>
    <input type="text" name="email" defaultValue={email} hidden />
    <input type="text" name="twofa_code" />
    <button type="submit">verify</button>
  </form>;
}