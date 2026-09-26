import { DrawerFooter } from "@repo/ui/components/shadcn/drawer";
import {
  TabsContent,
  TabsList,
  Tabs as TabsRoot,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type MediaTabs = "overall" | "seo";

export const MEDIA_TABS: MediaTabs[] = ["overall", "seo"];

const MEDIA_TAB_LABEL_KEYS: Record<MediaTabs, string> = {
  overall: "tabs.overallInfo",
  seo: "tabs.seo",
};

type MediaTabTriggerProps = {
  tab: MediaTabs;
  selected?: boolean;
  disabled?: boolean;
};

export function MediaTabTrigger({
  tab,
  selected = false,
  disabled = false,
}: MediaTabTriggerProps) {
  const t = useTranslations("atelier.media");
  const className = cn(
    // Base styles
    "font-medium transition-colors duration-200 px-4 py-2",
    // Disabled state
    disabled && ["cursor-not-allowed opacity-50"],
    // Enabled state
    !disabled && ["cursor-pointer"],
    // Selected state
    selected && [
      "bg-bg",
      "text-text",
      "shadow-sm",
      "font-semibold",
      "border",
      "border-border",
      "ring-1",
      "ring-border-em/20",
    ],
    // Unselected state
    !selected &&
      !disabled && [
        "text-text-muted",
        "hover:text-text/80",
        "hover:bg-fg-2/50",
      ],
  );

  return (
    <TabsTrigger
      value={tab}
      className={className}
      data-selected={selected}
      disabled={disabled}
    >
      {t(MEDIA_TAB_LABEL_KEYS[tab] as "tabs.overallInfo" | "tabs.seo")}
    </TabsTrigger>
  );
}

type MediaTabProps = {
  activeTab: MediaTabs;
  onTabChange: (value: string) => void;
  renderTabContent: (tab: MediaTabs) => ReactNode;
  disabled?: boolean;
};

export function MediaTab({
  activeTab,
  onTabChange,
  renderTabContent,
  disabled = false,
}: MediaTabProps) {
  // Only the fields scroll: the tab bar stays above them and the footer below, so the drawer's
  // actions stay reachable however long the form gets.
  return (
    <TabsRoot
      value={activeTab}
      onValueChange={disabled ? undefined : onTabChange}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <TabsList className="w-full grid grid-cols-2 h-10 bg-transparent p-0 gap-1">
          {MEDIA_TABS.map((tab) => (
            <MediaTabTrigger
              key={tab}
              tab={tab}
              selected={activeTab === tab}
              disabled={disabled}
            />
          ))}
        </TabsList>
      </div>
      {/* `data-vaul-no-drag`: scrolling or selecting text must never start a drawer swipe. */}
      <div
        data-vaul-no-drag
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {MEDIA_TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6 mt-0">
            {renderTabContent(tab)}
          </TabsContent>
        ))}
      </div>
    </TabsRoot>
  );
}

type MediaDrawerFooterProps = {
  children: ReactNode;
};

export function MediaDrawerFooter({ children }: MediaDrawerFooterProps) {
  // `shrink-0` pins it under the scrolling fields; the bottom padding clears the home indicator
  // on notched phones.
  return (
    <DrawerFooter className="mt-0 shrink-0 border-t bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
      <div className="flex w-full gap-3">{children}</div>
    </DrawerFooter>
  );
}
