"use client";

import { cn } from "@repo/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";

type CopyFieldProps = {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  /** Monospace for code snippets. */
  mono?: boolean;
};

/**
 * A read-only value with a one-click copy. The value stays selectable, so copying still works where
 * the Clipboard API is unavailable (insecure context, older browsers).
 */
export function CopyField({
  label,
  value,
  copyLabel,
  copiedLabel,
  mono = false,
}: CopyFieldProps) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the field is still selectable for a manual copy.
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs uppercase tracking-[0.15em] text-text-muted"
      >
        {label}
      </label>
      <div className="flex w-full items-stretch">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "min-w-0 flex-1 border border-border bg-fg px-3 py-2.5 text-sm text-text outline-none focus-visible:border-border-em",
            mono && "font-mono text-xs",
          )}
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 min-w-24 shrink-0 cursor-pointer items-center justify-center gap-2 border border-l-0 border-border px-4 text-xs uppercase tracking-[0.15em] text-text transition-colors hover:bg-fg-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
    </div>
  );
}
