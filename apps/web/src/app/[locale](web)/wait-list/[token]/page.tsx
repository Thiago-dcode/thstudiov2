import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import waitListService from '@/modules/wait-list/wait-list.service';

export const metadata: Metadata = {
  title: 'Validate Email - A11STUDIO',
  description: 'Validate your email address to confirm your wait list spot.',
};

export default async function WaitListValidatePage({
  params,
}: {
  params: Promise<{ token?: string }>;
}) {
  const { token } = await params;

  if (!token) {
    redirect('/');
  }

  const result = await waitListService.validate(token);

  if (result.error || !result.data) {
    redirect('/');
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16 tablet:px-10 tablet:py-24">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          Wait list
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          Email Validated!
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Thanks! Your email has been validated. We’ll email your invitation when it’s ready.
        </p>
      </div>
      <div className="mt-10 rounded-xl border border-border bg-fg-2/20 p-5 tablet:p-7">
        <div className="text-sm text-text">You’re all set.</div>
      </div>
    </section>
  );
}
