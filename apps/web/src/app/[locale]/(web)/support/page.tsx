import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { userSession } from '@/modules/auth/server-actions/user-session.action';
import { serverEnv } from '@/env/server';
import { SupportForm } from './_components/support-form';

export const metadata: Metadata = {
  title: 'Support - A11STUDIO',
  description: 'Contact A11STUDIO support for account, billing, or technical help.',
};

export default async function SupportPage() {
  const session = await userSession();
  const supportUserId = serverEnv.SUPPORT_USER_ID;
  const t = await getTranslations('support');
  const defaultName = session?.username;

  return (
    <section className='mx-auto w-full max-w-3xl px-6 py-16 tablet:px-10 tablet:py-24'>
      <div className='space-y-3'>
        <p className='text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted'>
          {t('contactLabel')}
        </p>
        <h1 className='text-3xl font-semibold tracking-tight text-text tablet:text-4xl'>
          {t('title')}
        </h1>
        <p className='max-w-2xl text-sm leading-relaxed text-text-muted'>
          {t('description')}
        </p>
      </div>

      <div className='mt-10 rounded-xl border border-border bg-fg-2/20 p-5 tablet:p-7'>
        <SupportForm
          supportUserId={supportUserId}
          defaultName={defaultName || undefined}
          defaultEmail={session?.email || undefined}
        />
      </div>
    </section>
  );
}
