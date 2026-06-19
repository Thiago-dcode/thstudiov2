import Link from "next/link";
import { redirect } from "next/navigation";
import PageComponent from "@/lib/components/page-component";
import { get2faCookieData } from "@/modules/auth/server-actions/twofa.action";
import { ExpiresIn } from "../__components/expiresIn";
import { TwoFaForm } from "../__components/twoFa-form";

export default async function TwoFactorAuth() {
 const user = await get2faCookieData();
 if (!user?.email) {
 redirect("/auth/login");
 }

 // Mask email for privacy (show first 2 chars and domain)
 const maskedEmail = user.email.replace(
 /(.{2})(.*)(@.*)/,
 (_, start, middle, domain) =>
 start + "*".repeat(Math.min(middle.length, 8)) + domain,
 );
 const expiresIn = () => {
 const expiresAt = user.twofa_expires_at
 ? new Date(user.twofa_expires_at)
 : null;
 if (!expiresAt) return 0;
 return expiresAt.getTime() - Date.now();
 };

 //TODO: handle is new register
 return (
 <PageComponent.Container>
 {/* Header */}

 <PageComponent.Content>
 <PageComponent.Header>
 {/* <MailOpen className="size-10" /> */}
 <PageComponent.Title
 title={user.is_new ? "Validate your email" : "Device verification"}
 />
 <PageComponent.SubTitle>
 <p className="text-sm">
 We've sent a verification code to{" "}
 <span className="font-medium">{maskedEmail}</span>
 </p>
 </PageComponent.SubTitle>
 </PageComponent.Header>
 <TwoFaForm user={user} />

 {/* Footer Links */}
 <div className="pt-4 ">
 <p className="text-sm text-text-muted">
 Having trouble?{" "}
 <Link href="/auth/login" className=" transition-colors text-text">
 Back to login
 </Link>
 </p>
 </div>
 </PageComponent.Content>

 <PageComponent.Footer>
 <ExpiresIn redirect="/auth/login" expiresIn={expiresIn()} />
 </PageComponent.Footer>
 </PageComponent.Container>
 );
}
