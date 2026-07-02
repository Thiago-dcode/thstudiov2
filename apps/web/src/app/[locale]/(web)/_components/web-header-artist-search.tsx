"use client";

import type { ArtistCard } from "@repo/common-lib/types/user";
import { Input } from "@repo/ui/components/shadcn/input";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { findArtistsAction } from "@/modules/users/server-actions/find-artists.action";

function artistDisplayName(a: ArtistCard): string {
  const full = [a.name, a.surname].filter(Boolean).join(" ").trim();
  return full || a.username;
}

function initials(a: ArtistCard): string {
  const n = artistDisplayName(a).trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0];
    const second = parts[1]?.[0];
    if (first && second) return (first + second).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

export function WebHeaderArtistSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("search.headerArtistSearch");
  const { isRegisterClose } = useAppStatus();
  const registrationIsClosed = !isRegisterClose;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRegistrationClosedToastAt = useRef(0);
  const [open, setOpen] = useState(false);

  const { result, isPending, handleAction, cleanResult } = useHandleAction({
    action: async () => {
      const search = inputRef.current?.value.trim() ?? "";
      if (!search) return null;
      return await findArtistsAction({ search, paginated: true });
    },
    settings: { rateLimit: 1.5 },
  });

  const showRegistrationClosedToast = () => {
    const now = Date.now();
    if (now - lastRegistrationClosedToastAt.current < 5000) return;

    lastRegistrationClosedToastAt.current = now;
    toast.message(t("registrationClosedToast"));
  };

  const blockIfRegistrationClosed = () => {
    if (!registrationIsClosed) return false;

    if (inputRef.current?.value) inputRef.current.value = "";
    cleanResult();
    setOpen(false);
    inputRef.current?.blur();
    showRegistrationClosedToast();
    return true;
  };

  const artists = result?.data ?? [];

  const handleChange = () => {
    if (blockIfRegistrationClosed()) return;

    const value = inputRef.current?.value.trim() ?? "";
    if (!value) {
      cleanResult();
      setOpen(false);
      return;
    }
    handleAction();
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (inputRef.current?.value) inputRef.current.value = "";
    cleanResult();
    setOpen(false);
  }, [cleanResult]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  if (pathname === "/artists") return null;
  return (
    <div
      ref={containerRef}
      role="search"
      aria-label="Search artists"
      className={cn("relative w-full min-w-0", className)}
    >
      <div className="relative">
        {isPending ? (
          <Loader2
            className="pointer-events-none absolute top-1/2 left-3 z-1 size-4 -translate-y-1/2 animate-spin text-text-muted"
            aria-hidden
          />
        ) : (
          <Search
            className="pointer-events-none absolute top-1/2 left-3 z-1 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
        )}
        <Input
          ref={inputRef}
          type="search"
          name="search"
          readOnly={registrationIsClosed}
          aria-disabled={registrationIsClosed}
          onChange={handleChange}
          onFocus={() => {
            if (blockIfRegistrationClosed()) return;
            if (artists.length > 0) setOpen(true);
          }}
          placeholder="Search artists…"
          autoComplete="off"
          className={cn(
            "h-9 w-full py-2 pr-3 pl-9 text-sm",
            registrationIsClosed && "cursor-not-allowed opacity-60",
          )}
        />
      </div>

      {open && artists.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden border border-border bg-bg shadow-lg">
          <ul className="max-h-80 overflow-y-auto py-1">
            {artists.map((artist) => (
              <li key={artist.id}>
                <Link
                  href={`/artists/${encodeURIComponent(artist.username)}`}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-fg/50"
                >
                  <div className="size-9 shrink-0 overflow-hidden bg-fg/60">
                    {artist.avatar ? (
                      <Image
                        src={artist.avatar}
                        alt=""
                        width={36}
                        height={36}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs font-medium text-text-muted">
                        {initials(artist)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight text-text">
                      {artistDisplayName(artist)}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      @{artist.username}
                      {artist.profession && (
                        <span className="text-text-muted/70">
                          {" "}
                          · {artist.profession}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
