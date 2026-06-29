"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AlertButton({
  condition = true,
  navigateTo,
  skipPath,
  label,
}: {
  condition?: boolean;
  skipPath?: string;
  navigateTo: string;
  label: string;
}) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (skipPath && pathname.includes(skipPath)) return null;

  if (condition || dismissed) return null;

  return (
    <div className="flex flex-row opacity-70 hover:opacity-100 cursor-pointer">
      <Link
        href={navigateTo}
        className="flex items-center gap-2 border border-border bg-bg px-2 py-2 text-xs! font-normal text-text shadow-lg transition-opacity hover:opacity-80 w-44 "
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping bg-white opacity-75" />
          <span className="relative inline-flex size-2 bg-white" />
        </span>
        {label}
        <ArrowRight className="size-4" />
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className=" border border-border bg-bg p-1.5 text-text-muted shadow-lg transition-colors hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
