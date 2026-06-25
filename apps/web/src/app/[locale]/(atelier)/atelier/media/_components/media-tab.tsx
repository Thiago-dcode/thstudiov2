import { DrawerFooter } from "@repo/ui/components/shadcn/drawer";
import {
  TabsContent,
  TabsList,
  Tabs as TabsRoot,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

export type MediaTabs = "overall" | "seo";

export const MEDIA_TABS: MediaTabs[] = ["overall", "seo"];

export const MEDIA_TAB_CONFIG: Record<MediaTabs, { label: string }> = {
  overall: { label: "Overall Info" },
  seo: { label: "SEO" },
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
      {MEDIA_TAB_CONFIG[tab].label}
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
  return (
    <div className="flex-1 overflow-y-auto">
      <TabsRoot
        value={activeTab}
        onValueChange={disabled ? undefined : onTabChange}
        className="h-full flex flex-col"
      >
        <div className="px-6 pt-6">
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {MEDIA_TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-6 mt-0">
              {renderTabContent(tab)}
            </TabsContent>
          ))}
        </div>
      </TabsRoot>
    </div>
  );
}

type MediaDrawerFooterProps = {
  children: ReactNode;
};

export function MediaDrawerFooter({ children }: MediaDrawerFooterProps) {
  return (
    <DrawerFooter className="border-t px-6 py-4 bg-fg/60">
      <div className="flex gap-3 w-full">{children}</div>
    </DrawerFooter>
  );
}
