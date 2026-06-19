import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
 return (
 <div className="w-full flex justify-center px-5 tablet:px-10 py-16 tablet:py-24">
 <article className="max-w-3xl w-full space-y-10">{children}</article>
 </div>
 );
}
