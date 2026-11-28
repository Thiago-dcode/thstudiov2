import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Library } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import collectionService from "@/modules/collections/collection.service";
import { CollectionCover } from "@/modules/collections/components/collection-card";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";
import { CollectionSortable } from "./_components/collection-sortable";

export default async function CollectionListPage() {
  const t = await getTranslations("atelier.collections");
  const tCommon = await getTranslations("atelier.common");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }
  const collectionsResponse = await collectionService.findAll({
    user_id: userAuth.id,
  });

  if (collectionsResponse.error) {
    return <div>{collectionsResponse?.error?.message || t("loadError")}</div>;
  }

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")} info={t("pageInfo")}>
        <CreateResourceButton
          resource={TABLES_ENUM.COLLECTIONS}
          href="collections/create"
          label={t("createButtonLabel")}
        />
      </AdminPageTitle>
      {collectionsResponse.data.length > 0 ? (
        <CollectionSortable
          username={userAuth.username}
          items={collectionsResponse.data.map((collection) => ({
            id: collection.id,
            slug: collection.slug,
            title: collection.title,
            is_active: collection.is_active,
            created_at: collection.created_at,
            updated_at: collection.updated_at,
            is_blocked: Boolean(collection.blocked_at),
            media: (
              <CollectionCover
                collection={collection}
                isBlocked={Boolean(collection.blocked_at)}
                blockedLabel={tCommon("blocked")}
              />
            ),
          }))}
        />
      ) : (
        <AdminPageEmptyState
          icon={<Library />}
          description={t("emptyStateDescription")}
        >
          <CreateResourceButton
            resource={TABLES_ENUM.COLLECTIONS}
            href="collections/create"
            label={t("createButtonLabel")}
            variant="outline"
          />
        </AdminPageEmptyState>
      )}
    </AdminPageContainer>
  );
}
