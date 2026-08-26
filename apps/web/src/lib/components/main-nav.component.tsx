"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import {
  Bell,
  BookUser,
  Box,
  Briefcase,
  ChartBar,
  ChevronDown,
  Contact,
  Ellipsis,
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

type Route = {
  nameKey: string;
  url?: string;
  matches?: string[];
  icon?: ReactNode;
  children?: Route[];
};

const routes: Route[] = [
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
    nameKey: "misc",
    icon: <Ellipsis size={20} />,
    children: [
      {
        nameKey: "contacts",
        url: "misc/contacts",
        icon: <Contact size={18} />,
      },
      {
        nameKey: "notifications",
        url: "misc/notifications",
        icon: <Bell size={18} />,
      },
    ],
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

const buildUrl = (url?: string) => `/atelier${!url ? "" : "/"}${url ?? ""}`;

/** A route is active when its own url/matches hit, or when any descendant is. */
const isRouteActive = (route: Route, pathname: string): boolean => {
  if (route.url !== undefined && pathname === buildUrl(route.url)) return true;
  if (route.matches?.some((match) => pathname === `/atelier/${match}`))
    return true;
  return (
    route.children?.some((child) => isRouteActive(child, pathname)) ?? false
  );
};

const groupRoutes = routes.filter((route) => route.children?.length);

const openGroupsFor = (pathname: string) =>
  Object.fromEntries(
    groupRoutes.map((route) => [route.nameKey, isRouteActive(route, pathname)]),
  );

const NavLink = ({
  route,
  name,
  isActive,
  isShrinked,
  isChild = false,
  isReachable = true,
}: {
  route: Route;
  name: string;
  isActive: boolean;
  isShrinked: boolean;
  isChild?: boolean;
  isReachable?: boolean;
}) => (
  <Link
    href={buildUrl(route.url)}
    title={isShrinked ? name : undefined}
    aria-current={isActive ? "page" : undefined}
    tabIndex={isReachable ? undefined : -1}
    className={`text-sm flex items-center gap-3 transition-colors duration-200
 ${isShrinked ? "justify-center px-2 py-2" : isChild ? "pl-9 pr-3 py-2" : "px-3 py-2"}
 ${isActive ? "bg-text text-bg" : "hover:bg-fg-2"}
 `}
  >
    {route.icon ? (
      <span className="shrink-0">{route.icon}</span>
    ) : (
      isShrinked && <span className="shrink-0 w-5 text-center">{name[0]}</span>
    )}
    {!isShrinked && <span className="truncate">{name}</span>}
  </Link>
);

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    openGroupsFor(pathname),
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Navigating into a group always reveals it, without collapsing the groups
  // the user opened by hand.
  useEffect(() => {
    setOpenGroups((prev) => {
      const active = groupRoutes.filter((route) =>
        isRouteActive(route, pathname),
      );
      if (active.every((route) => prev[route.nameKey])) return prev;
      const next = { ...prev };
      for (const route of active) next[route.nameKey] = true;
      return next;
    });
  }, [pathname]);

  if (!isClient) return <Spinner />;

  return (
    <div className="flex flex-col items-start w-full justify-between h-full">
      <nav className="flex flex-col gap-2 w-full items-start h-full justify-start  px-2">
        {routes.map((route) => {
          const name = t(route.nameKey as any);
          const isActive = isRouteActive(route, pathname);

          if (!route.children?.length) {
            return (
              <NavLink
                key={route.nameKey}
                route={route}
                name={name}
                isActive={isActive}
                isShrinked={isShrinked}
              />
            );
          }

          const groupId = `main-nav-group-${route.nameKey}`;
          const isOpen = openGroups[route.nameKey] ?? false;

          return (
            <div key={route.nameKey} className="w-full flex flex-col">
              <button
                type="button"
                title={isShrinked ? name : undefined}
                aria-expanded={isOpen}
                aria-controls={groupId}
                onClick={() =>
                  setOpenGroups((prev) => ({
                    ...prev,
                    [route.nameKey]: !isOpen,
                  }))
                }
                className={`text-sm flex items-center gap-3 transition-colors duration-200 cursor-pointer
 ${isShrinked ? "justify-center px-2 py-2" : "px-3 py-2"}
 ${isActive ? "bg-fg-2" : "hover:bg-fg-2"}
 `}
              >
                <span className="shrink-0">{route.icon}</span>
                {!isShrinked && (
                  <>
                    <span className="truncate">{name}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </>
                )}
              </button>
              <div
                id={groupId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col items-start gap-1 pt-1">
                    {route.children.map((child) => (
                      <NavLink
                        key={child.nameKey}
                        route={child}
                        name={t(child.nameKey as any)}
                        isActive={isRouteActive(child, pathname)}
                        isShrinked={isShrinked}
                        isChild
                        isReachable={isOpen}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-t-fg-2 w-full flex items-center justify-center px-2 py-2">
        <LogoutDialog />
      </div>
    </div>
  );
};
