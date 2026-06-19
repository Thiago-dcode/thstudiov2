"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import type { ReactNode } from "react";

type ProfileTab = {
  value: string;
  label: string;
  content: ReactNode;
};

export const ArtistProfileTabs = ({ tabs }: { tabs: ProfileTab[] }) => {
  const firstTab = tabs[0]?.value;

  if (!tabs.length) return null;

  return (
    <Tabs defaultValue={firstTab} className="w-full">
      <div className="w-full border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <TabsList className="h-auto bg-transparent p-0 gap-8">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative bg-transparent px-0 py-4 text-xs uppercase tracking-[0.2em] text-text-muted shadow-none transition-colors duration-300 hover:text-text data-[state=active]:text-text data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-px data-[state=active]:after:bg-text"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-0 pt-12 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
