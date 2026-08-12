"use client";

import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { cn } from "@repo/ui/lib/utils";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type SiteHeaderContextValue = {
  scrolled: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isMounted: boolean;
  closeDrawer: () => void;
};

const SiteHeaderContext = createContext<SiteHeaderContextValue | null>(null);

export function useSiteHeader() {
  const context = useContext(SiteHeaderContext);
  if (!context) {
    throw new Error(
      "SiteHeader compound components must be used within SiteHeader",
    );
  }
  return context;
}

const menuButtonClassName =
  "tablet:hidden flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity";

function MenuButton(props: React.ComponentProps<"button">) {
  const t = useTranslations("siteHeader");
  return (
    <button
      type="button"
      className={menuButtonClassName}
      aria-label={t("openNavigation")}
      {...props}
    >
      <Menu className="size-5" />
    </button>
  );
}

function Root({
  children,
  variant = "web",
  className,
}: {
  children: ReactNode;
  variant?: "web" | "artist";
  className?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultBorderClass =
    variant === "artist" ? "border-b-fg-2" : "border-b-fg";

  return (
    <SiteHeaderContext.Provider
      value={{
        scrolled,
        drawerOpen,
        setDrawerOpen,
        isMounted,
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-center border-b transition-all duration-300 bg-bg",
          scrolled
            ? "border-b-fg-2/50 bg-transparent hover:bg-bg opacity-60 backdrop-blur-sm hover:opacity-100 hover:border-b-fg-2"
            : cn(defaultBorderClass, "opacity-100"),
          className,
        )}
      >
        {children}
      </header>
    </SiteHeaderContext.Provider>
  );
}

function Bar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-20 flex items-center justify-between px-2 tablet:px-8 laptop:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Logo({
  className,
  closeOnClick = false,
}: {
  className?: string;
  closeOnClick?: boolean;
}) {
  const { closeDrawer } = useSiteHeader();

  return (
    <Link
      href="/"
      onClick={closeOnClick ? closeDrawer : undefined}
      className={cn(
        "shrink-0 text-text hover:opacity-80 transition-opacity",
        className,
      )}
    >
      <BrandLogo />
    </Link>
  );
}

function Actions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "hidden shrink-0 tablet:flex items-center gap-8",
        className,
      )}
    >
      {children}
    </nav>
  );
}

function MobileControls({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center shrink-0 gap-0 tablet:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MobileMenu({
  children,
  contentClassName,
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  const { drawerOpen, setDrawerOpen, isMounted } = useSiteHeader();
  const t = useTranslations("siteHeader");

  if (!isMounted) {
    return <MenuButton />;
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
      <DrawerTrigger asChild>
        <MenuButton />
      </DrawerTrigger>

      <DrawerContent
        className={cn(
          "mt-0 border-0 bg-bg [&>div:first-child]:hidden",
          contentClassName,
        )}
      >
        <DrawerTitle className="sr-only">{t("navigation")}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

function MobileDrawerBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("siteHeader");
  return (
    <div
      className={cn(
        "flex items-center justify-between h-16 border-b border-fg-2",
        className,
      )}
    >
      {children}
      <DrawerClose asChild>
        <button
          type="button"
          className="flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
          aria-label={t("closeNavigation")}
        >
          <X className="size-5" />
        </button>
      </DrawerClose>
    </div>
  );
}

function MobileDrawerBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}

function MobileDrawerFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-auto border-t border-fg-2", className)}>
      {children}
    </div>
  );
}

export const SiteHeader = Object.assign(Root, {
  Bar,
  Logo,
  Actions,
  MobileControls,
  MobileMenu,
  MobileDrawerBar,
  MobileDrawerBody,
  MobileDrawerFooter,
});
