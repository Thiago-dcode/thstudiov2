import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import { CreateOrUpdateCollection } from "../../_components/create-update-collection";
import { DeleteCollectionDialog } from "../../_components/delete-collection-dialog";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionEdit({ params }: Props) {
  const t = await getTranslations("atelier.collections");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const { slug } = await params;
  const collectionResponse = await userCollectionService.getByUsername(
    userAuth.username,
    slug,
  );

  if (collectionResponse.error) {
    return <div>{collectionResponse?.error?.message || t("loadError")}</div>;
  }

  if (!collectionResponse.data) {
    notFound();
  }

  const collection = collectionResponse.data;
  const publicHref = userAuth.username
    ? `/artists/${userAuth.username}/collections/${collection.slug}`
    : undefined;

  return (
    <AdminPageContainer>
      <AdminPageTitle
        title={t("editTitlePrefix", { title: collection.title })}
        publicHref={publicHref}
        info={t("pageInfo")}
      >
        <DeleteCollectionDialog
          collectionId={collection.id}
          collectionTitle={collection.title}
        />
      </AdminPageTitle>
      <CreateOrUpdateCollection defaultCollection={collection} />
    </AdminPageContainer>
  );
}
