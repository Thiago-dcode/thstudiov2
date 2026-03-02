import { ReactNode } from "react";

export default function WebLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header />
      <main className="flex-1">{children}</main>
      <footer />
    </div>
  );
}
