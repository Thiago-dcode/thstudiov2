import { config } from "@/lib/config";
import Link from "next/link";
import { ReactNode } from "react";

export default function WebLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col w-full">
      <header className="w-full py-6 flex items-center justify-center  shadow-sm shadow-fg-1 bg-fg">
        <nav className="flex items-center h-full justify-between px-8 w-full">
          <Link className="sm:text-lg text-base" href={'/'}>{config.app_name.toUpperCase()}</Link>
          <div>
            <Link href={'/auth/register'} className="bg-accent text-white text-xs sm:text-sm px-4 py-2 rounded-3xl ">Create an account</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 size-full">{children}</main>
      <footer />
    </div>
  );
}
