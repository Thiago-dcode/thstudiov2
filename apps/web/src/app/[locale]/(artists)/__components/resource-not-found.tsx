import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

type ResourceNotFoundProps = {
  username: string;
  message: string;
};

export function ResourceNotFound({ username, message }: ResourceNotFoundProps) {
  return (
    <div className="py-8 w-full flex flex-col items-center justify-center min-h-[70vh] px-6 animate-in fade-in duration-700">
      <div className="relative flex flex-col items-center text-center max-w-lg">
        <span className="text-[8rem] tablet:text-[10rem] font-serif italic leading-none tracking-tighter text-text/5 select-none">
          404
        </span>

        <div className="w-full absolute top-1/2 mt-8 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
          <div className="p-4 rounded-full border border-border/40">
            <Search className="size-6 text-text-muted/60" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl tablet:text-3xl font-serif italic tracking-tight">
              Resource not found
            </h1>
            <p className="text-sm tablet:text-base text-text-muted leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>

          <div className="w-8 h-px bg-border/60" />

          <Link
            href={`/artists/${username}`}
            className="inline-flex items-center gap-2.5 px-7 py-3 text-xs tracking-[0.15em] uppercase text-text-muted border border-border/50 rounded-sm hover:text-text hover:border-text/30 transition-all duration-300 group"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>Back to profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
