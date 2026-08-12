"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import {
  BookUser,
  Box,
  Briefcase,
  ChartBar,
  LayoutDashboard,
  Library,
  Settings,
  UserRoundPen,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { LogoutDialog } from "@/app/[locale]/(atelier)/__components/logout-dialog";
import { Link } from "@/i18n/navigation";
import { useMainNav } from "../providers/main-nav.provider";

const routes: {
  nameKey:
    | "dashboard"
    | "home"
    | "media"
    | "collections"
    | "portfolios"
    | "services"
    | "about"
    | "settings";
  url: string;
  matches?: string[];
  icon: ReactNode;
}[] = [
  {
    nameKey: "dashboard",
    url: "",
    icon: <ChartBar size={20} />,
  },
  {
    nameKey: "home",
    url: "home",
    icon: <UserRoundPen size={20} />,
  },
  {
    nameKey: "media",
    url: "media",
    icon: <Box size={20} />,
  },
  {
    nameKey: "collections",
    url: "collections",
    icon: <Library size={20} />,
  },
  {
    nameKey: "portfolios",
    url: "portfolios",
    icon: <LayoutDashboard size={20} />,
  },
  {
    nameKey: "services",
    url: "services",
    icon: <Briefcase size={20} />,
  },
  {
    nameKey: "about",
    url: "about",
    icon: <BookUser size={20} />,
  },
  {
    nameKey: "settings",
    url: "settings",
    icon: <Settings size={20} />,
  },
];

export const MainNav = ({
  forceExpanded = false,
}: {
  forceExpanded?: boolean;
}) => {
  const t = useTranslations("atelier.nav");
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { shrinked } = useMainNav();
  const isShrinked = forceExpanded ? false : shrinked;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <Spinner />;

  return (
    <div className="flex flex-col items-start w-full justify-between h-full">
      <nav className="flex flex-col gap-2 w-full px-2">
        {routes.map((route) => {
          const name = t(route.nameKey);
          const url = `/atelier${!route.url ? "" : "/"}${route.url}`;
          const isActive =
            pathname === url ||
            route.matches?.some((match) => pathname === `/atelier/${match}`);
          return (
            <Link
              key={route.url}
              href={url}
              title={isShrinked ? name : undefined}
              className={`text-sm flex items-center gap-3 transition-colors duration-200
 ${isShrinked ? "justify-center px-2 py-2" : "px-3 py-2"}
 ${isActive ? "bg-text text-bg" : "hover:bg-fg-2"}
 `}
            >
              <span className="shrink-0">{route.icon}</span>
              {!isShrinked && <span className="truncate">{name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-t-fg-2 w-full flex items-center justify-center px-2 py-2">
        <LogoutDialog />
      </div>
    </div>
  );
};
