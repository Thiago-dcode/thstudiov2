import { isArtistRouteSegment } from "@repo/common-lib/utils/username";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; username: string }>;
};

/**
 * Legacy `/artists/{username}/…` URLs. The 308 itself is sent by `[[...rest]]/page.tsx`, because a
 * layout never sees its children's params (the sub-path) or the query string. This layout only
 * rejects a segment that can't be an artist (`/artists/about`) up front, with no API call.
 */
export default async function LegacyArtistLayout({ children, params }: Props) {
  const { username } = await params;
  if (!isArtistRouteSegment(username)) notFound();
  return children;
}
