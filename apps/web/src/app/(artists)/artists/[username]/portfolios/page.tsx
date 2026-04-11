import { notFound } from "next/navigation";
import { ArtistBreadcrumb } from "@/app/(artists)/__components/artist-breadcrumb";
import Web from "@/lib/components/web-page.component";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function Page({ params }: Props) {
  const { username } = await params;

  const [userExist, response] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getAllByUsername(username),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const portfolios = response.data || [];

  return (
    <Web.Container>
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/portfolios`,
            title: "Portfolios",
            isActive: true,
          },
        ]}
      />

      <Web.Header title="Portfolios" />

      {portfolios.length > 0 ? (
        <Web.List>
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              username={username}
              titleAs="h2"
            />
          ))}
        </Web.List>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
          No portfolios yet.
        </div>
      )}
    </Web.Container>
  );
}
