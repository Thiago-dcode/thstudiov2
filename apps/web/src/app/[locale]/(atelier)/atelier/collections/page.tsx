import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Library } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import collectionService from "@/modules/collections/collection.service";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { CreateResourceButton } from "../../__components/create-resource-button";

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {collectionsResponse.data.map((collection) => (
            <Link
              key={collection.id}
              href={`/atelier/collections/edit/${collection.slug}`}
            >
              <CollectionCard
                collection={collection}
                isAtelier
                blockedLabel={tCommon("blocked")}
              />
            </Link>
          ))}
        </div>
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
