import { loginServerAction } from "@/modules/auth/server-actions/login-server.action";


export default async function Login({ searchParams }: { searchParams: Promise<{ "errors[]"?: string[], email?: string }> }) {
  const { "errors[]": errors, email } = await searchParams;
  console.log("errors", errors);
  console.log("email", email);
  return <form action={loginServerAction}>
    <input type="text" name="email" defaultValue={email} />
    <input type="password" name="password" />
    <button type="submit">Login</button>
  </form>;
}