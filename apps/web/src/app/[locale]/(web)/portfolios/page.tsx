import {
  DirectoryPage,
  directoryMetadata,
} from "../_components/directory/directory-page";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** The `/portfolios` directory hub (404 while `isDirectoryOpen()` is false). */
export function generateMetadata(props: Props) {
  return directoryMetadata("portfolios", props);
}

export default function Page(props: Props) {
  return <DirectoryPage segment="portfolios" {...props} />;
}
