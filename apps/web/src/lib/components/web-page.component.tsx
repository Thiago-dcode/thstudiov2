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
    <div
      className={cn(
        "mx-auto w-full max-w-(--breakpoint-ultrawide) px-6 py-4 md:px-12 tablet:py-8 animate-in fade-in duration-1000",
        className,
      )}
    >
      {children}
    </div>
  );
};

const Header = ({
  title,
  description,
  children,
  titleClassName,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  titleClassName?: string;
}) => {
  return (
    <header className="mb-8 desktop:mb-12 flex flex-col items-center justify-center gap-6 pb-6">
      <div className="w-full max-w-5xl space-y-5">
        <div className="flex items-baseline gap-4 justify-center">
          <h1 className={cn(" tracking-tight", titleClassName)}>{title}</h1>
          {children}
        </div>
        {description && (
          <p className="w-full text-base! leading-relaxed text-text md:text-lg text-center">
            {description}
          </p>
        )}
      </div>
    </header>
  );
};

const List = ({ children }: { children: Iterable<ReactNode> }) => {
  return (
    <section className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-5">
      {Array.from(children)}
    </section>
  );
};

export default {
  Container,
  Header,
  List,
};
