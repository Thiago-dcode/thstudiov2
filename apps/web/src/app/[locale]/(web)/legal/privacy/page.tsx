import type { Metadata } from "next";
import { serverEnv } from "@/env/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy — A11STUDIO" },
  description: "How A11STUDIO collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "March 16, 2026";

export default function PrivacyPolicyPage() {
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  return (
    <>
      <header className="space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          Last updated — {LAST_UPDATED}
        </p>
        <h1 className="text-3xl tablet:text-4xl font-bold tracking-tight text-text">
          Privacy Policy
        </h1>
        <p className="text-sm leading-relaxed text-text-muted max-w-2xl">
          This policy describes how A11STUDIO collects, uses, stores, and
          protects your information when you use our platform. We are committed
          to transparency and to safeguarding your data.
        </p>
      </header>

      <Section title="1. Data Controller">
        <P>
          A11STUDIO (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the
          data controller responsible for your personal data. For any
          privacy-related inquiries, contact us at{" "}
          <A href={`mailto:${supportEmail}`}>{supportEmail}</A>.
        </P>
      </Section>

      <Section title="2. Information We Collect">
        <P>
          We collect different categories of information depending on how you
          use the platform:
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            <strong>Account information</strong> — basic profile details you
            provide when registering and setting up your account, such as your
            name, email, and any optional profile content you choose to add
          </li>
          <li>
            <strong>Location data</strong> — if you choose to add an address to
            your profile, we store the information necessary to display your
            location publicly
          </li>
          <li>
            <strong>Content you create</strong> — media files, portfolios,
            services, projects, and any associated descriptions or metadata you
            provide through the platform
          </li>
          <li>
            <strong>Business data</strong> — if you use client and project
            management features, we store the relevant contact and project
            information you enter
          </li>
          <li>
            <strong>Messages</strong> — when visitors contact an artist through
            the platform, we collect the information included in the contact
            form
          </li>
          <li>
            <strong>Security data</strong> — technical information related to
            sign-in activity and device identification, used to protect your
            account
          </li>
        </ul>
      </Section>

      <Section title="3. Payment Data">
        <P>
          Subscription payments are processed entirely by third-party providers.
          We store only the references necessary to manage your subscription and
          billing history. We do <strong>not</strong> store credit card numbers,
          bank account details, or other raw payment credentials — these are
          handled by the payment processor under their own privacy policies.
        </P>
      </Section>

      <Section title="4. AI Processing">
        <P>
          A11STUDIO uses artificial intelligence to power features such as
          content suggestions and automated content moderation. We track usage
          to manage your AI credit allocation. AI processing is performed by
          third-party providers, and only the minimum data necessary is sent for
          processing.
        </P>
      </Section>

      <Section title="5. How We Use Your Data">
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>Providing and operating the portfolio platform</li>
          <li>Authenticating your identity and securing your account</li>
          <li>Processing subscription payments and managing billing</li>
          <li>Delivering AI-assisted features</li>
          <li>Enforcing content policies through automated moderation</li>
          <li>Sending transactional emails and notifications</li>
          <li>Displaying your public artist profile and content</li>
          <li>Delivering contact form messages between visitors and artists</li>
        </ul>
      </Section>

      <Section title="6. Data Sharing">
        <P>
          We do not sell your personal data. We share data only with the
          following third-party services as necessary to operate the platform:
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            <strong>Stripe & PayPal</strong> — for payment processing and
            subscription management
          </li>
          <li>
            <strong>AI / LLM service providers</strong> — for content generation
            and media moderation
          </li>
          <li>
            <strong>Email service provider</strong> — for transactional emails
            (verification, password recovery, notifications)
          </li>
        </ul>
      </Section>

      <Section title="7. Data Retention">
        <P>
          We retain your personal data for as long as your account is active.
          Security logs are retained for account protection purposes, and
          payment records are retained as required by applicable regulations.
          When you delete your account, we remove your personal data and
          associated content within a reasonable timeframe, except where
          retention is required by law.
        </P>
      </Section>

      <Section title="8. Your Rights">
        <P>
          Depending on your jurisdiction, you may have the following rights
          regarding your personal data:
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            <strong>Access</strong> — request a copy of the data we hold about
            you
          </li>
          <li>
            <strong>Rectification</strong> — correct inaccurate or incomplete
            data
          </li>
          <li>
            <strong>Erasure</strong> — request deletion of your personal data
          </li>
          <li>
            <strong>Data portability</strong> — receive your data in a
            structured, machine-readable format
          </li>
          <li>
            <strong>Restriction</strong> — request that we limit processing of
            your data
          </li>
          <li>
            <strong>Objection</strong> — object to processing based on
            legitimate interests
          </li>
        </ul>
        <P>
          To exercise any of these rights, contact us at{" "}
          <A href={`mailto:${supportEmail}`}>{supportEmail}</A>.
        </P>
      </Section>

      <Section title="9. Security">
        <P>
          We implement industry-standard security measures to protect your data,
          including encryption, secure authentication, and access controls.
          While no system is completely immune to breaches, we take reasonable
          steps to safeguard your information.
        </P>
      </Section>

      <Section title="10. Cookies">
        <P>
          We use cookies for essential platform functionality. For full details,
          see our{" "}
          <Link
            href="/legal/cookies"
            className="text-text underline underline-offset-4 hover:text-text-muted transition-colors"
          >
            Cookie Policy
          </Link>
          .
        </P>
      </Section>

      <Section title="11. Changes to This Policy">
        <P>
          We may update this policy from time to time. Changes will be posted on
          this page with an updated revision date. Continued use of the platform
          after changes constitutes acceptance of the revised policy.
        </P>
      </Section>

      <Section title="12. Contact">
        <P>
          For questions or concerns about this privacy policy or your personal
          data, contact us at{" "}
          <A href={`mailto:${supportEmail}`}>{supportEmail}</A>.
        </P>
      </Section>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-text-muted">{children}</p>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-text underline underline-offset-4 hover:text-text-muted transition-colors"
    >
      {children}
    </a>
  );
}
