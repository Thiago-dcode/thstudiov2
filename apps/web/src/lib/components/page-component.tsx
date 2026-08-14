import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

const Container = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className="flex size-full justify-center overflow-y-auto py-8 px-1">
      <div
        className={cn(
          "w-full min-h-full max-w-sm my-auto justify-center flex flex-col",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

const Content = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        " flex flex-col w-full justify-between items-center gap-8 py-8 px-4 inset-shadow-xs inset-shadow-fg-2",
        className,
      )}
    >
      {children}
    </div>
  );
};

const Header = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="text-center flex flex-col items-center gap-2 ">
      {children}
    </div>
  );
};
const Title = ({ title }: { title: string }) => {
  return <h1 className="text-2xl! font-bold text-text">{title}</h1>;
};
const SubTitle = ({
  subTitle,
  children,
}: {
  subTitle?: string;
  children?: ReactNode;
}) => {
  return (
    <div className="text-text-muted">
      {subTitle ? <p>{subTitle}</p> : children}
    </div>
  );
};
const Footer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mt-6 text-center text-xs! text-text-muted">{children}</div>
  );
};
export default {
  Container,
  Content,
  Header,
  Title,
  SubTitle,
  Footer,
};
