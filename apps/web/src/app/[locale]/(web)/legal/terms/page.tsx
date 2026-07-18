import type { Metadata } from "next";
import { serverEnv } from "@/env/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Terms of Service — A11STUDIO",
  description:
    "Terms and conditions for using the A11STUDIO portfolio platform.",
};

const LAST_UPDATED = "March 16, 2026";

export default function TermsOfServicePage() {
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  return (
    <>
      <header className="space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          Last updated — {LAST_UPDATED}
        </p>
        <h1 className="text-3xl tablet:text-4xl font-bold tracking-tight text-text">
          Terms of Service
        </h1>
        <p className="text-sm leading-relaxed text-text-muted max-w-2xl">
          These terms govern your use of the A11STUDIO platform. By creating an
          account or using our services, you agree to be bound by these terms.
        </p>
      </header>

      <Section title="1. Acceptance of Terms">
        <P>
          By accessing or using A11STUDIO (&quot;the Platform&quot;), you agree
          to these Terms of Service. If you do not agree, you must not use the
          Platform. We may update these terms at any time — continued use after
          changes constitutes acceptance.
        </P>
      </Section>

      <Section title="2. Account Registration">
        <P>
          To use the Platform, you must create an account by providing a valid
          email address, a unique username, and a password. You are responsible
          for maintaining the confidentiality of your credentials.
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>Your email must be verified before full access is granted.</li>
          <li>
            Two-factor authentication (2FA) may be required during sign-in for
            additional security.
          </li>
          <li>
            Username changes are limited. Excessive resets may be restricted.
          </li>
          <li>You must be at least 16 years old to create an account.</li>
        </ul>
      </Section>

      <Section title="3. Subscription Plans">
        <P>
          A11STUDIO offers free and paid subscription plans. Each plan defines
          limits on storage, media uploads, portfolios, projects, clients,
          services, and AI credits.
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            Paid plans are billed through <strong>Stripe</strong> or{" "}
            <strong>PayPal</strong> on a recurring basis (monthly or annual).
          </li>
          <li>
            Subscriptions auto-renew unless cancelled before the next billing
            date.
          </li>
          <li>
            You may manage or cancel your subscription from your account
            settings at any time.
          </li>
          <li>
            Promotional offers and discounts may apply to specific plan prices
            and are subject to their own terms.
          </li>
        </ul>
      </Section>

      <Section title="4. Content Ownership">
        <P>
          You retain full ownership of any content you upload to the Platform,
          including images, media files, portfolio descriptions, and profile
          information. By uploading content, you grant A11STUDIO a limited,
          non-exclusive, worldwide license to display, distribute, and
          technically process your content solely for the purpose of operating
          the Platform and providing the service.
        </P>
        <P>
          This license terminates when you delete your content or your account.
          Cached or archived copies may persist briefly after deletion due to
          technical requirements.
        </P>
      </Section>

      <Section title="5. Acceptable Use">
        <P>You agree not to upload, publish, or transmit content that:</P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>Violates any applicable law or regulation</li>
          <li>Infringes on intellectual property rights of others</li>
          <li>
            Contains illegal, harmful, threatening, or discriminatory material
          </li>
          <li>Is fraudulent, deceptive, or misleading</li>
          <li>Contains malware, viruses, or harmful code</li>
        </ul>
        <P>
          All uploaded media is subject to{" "}
          <strong>automated content moderation</strong>. Content that violates
          our policies may be blocked automatically. You are solely responsible
          for any content you upload to the Platform — A11STUDIO assumes no
          liability for harmful, illegal, or otherwise prohibited material
          uploaded by users.
        </P>
      </Section>

      <Section title="6. Moderation & Account Strikes">
        <P>
          A11STUDIO enforces a strike-based moderation system to maintain
          platform integrity:
        </P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            Policy violations result in <strong>account strikes</strong>.
            Accumulating strikes may lead to temporary suspension or permanent
            ban.
          </li>
          <li>
            Temporary bans have a defined start and end date. During a ban, your
            account and public profile are inaccessible.
          </li>
          <li>
            Permanent bans are issued for severe or repeated violations. A
            reason will be provided.
          </li>
        </ul>
      </Section>

      <Section title="7. Illegal Content & Law Enforcement">
        <P>
          A11STUDIO has a <strong>zero-tolerance policy</strong> toward illegal
          content, including but not limited to child sexual abuse material
          (CSAM), content depicting the exploitation or abuse of minors, and any
          other material that constitutes a criminal offense under applicable
          law.
        </P>
        <P>
          If such content is detected — whether through automated moderation or
          manual review — we reserve the right to immediately and permanently
          terminate the offending account, preserve relevant evidence, and{" "}
          <strong>
            report the incident to the appropriate law enforcement authorities
          </strong>
          , including but not limited to local police, national agencies, and
          international organizations such as NCMEC or Interpol.
        </P>
        <P>
          The uploading user bears full legal responsibility for any illegal
          content they introduce to the Platform.
        </P>
      </Section>

      <Section title="8. Service Limitations">
        <P>Each subscription plan has defined limits:</P>
        <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            <strong>Storage</strong> — maximum total media size and daily upload
            limits
          </li>
          <li>
            <strong>Content</strong> — maximum number of portfolios, projects,
            clients, and services
          </li>
          <li>
            <strong>AI credits</strong> — limited credits per billing cycle for
            AI-assisted features (SEO generation, content suggestions), which
            reset periodically
          </li>
          <li>
            <strong>Media compression</strong> — availability depends on your
            plan tier
          </li>
        </ul>
        <P>
          Exceeding these limits may restrict certain features until you upgrade
          your plan or the next billing cycle begins.
        </P>
      </Section>

      <Section title="9. Intellectual Property">
        <P>
          The A11STUDIO platform — including its design, code, brand, and
          features — is the intellectual property of A11STUDIO. You may not
          copy, modify, distribute, or reverse-engineer any part of the
          Platform.
        </P>
        <P>
          User-generated content remains the property of its creator as
          described in Section 4.
        </P>
      </Section>

      <Section title="10. Termination">
        <P>
          You may delete your account at any time from your account settings.
          Upon deletion, your personal data, media, and content will be removed
          as described in our{" "}
          <Link
            href="/legal/privacy"
            className="text-text underline underline-offset-4 hover:text-text-muted transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </P>
        <P>
          We reserve the right to suspend or terminate accounts that violate
          these terms, abuse the platform, or engage in fraudulent activity.
        </P>
      </Section>

      <Section title="11. Disclaimer of Warranties">
        <P>
          The Platform is provided &quot;as is&quot; and &quot;as
          available&quot; without warranties of any kind, whether express or
          implied, including but not limited to merchantability, fitness for a
          particular purpose, or non-infringement. We do not guarantee
          uninterrupted or error-free service.
        </P>
      </Section>

      <Section title="12. Limitation of Liability">
        <P>
          To the maximum extent permitted by law, A11STUDIO shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the Platform, including loss of data,
          revenue, or profits.
        </P>
      </Section>

      <Section title="13. Governing Law">
        <P>
          These terms are governed by and construed in accordance with
          applicable law. Any disputes arising from these terms or your use of
          the Platform shall be resolved in the competent courts of the
          jurisdiction where A11STUDIO is established.
        </P>
      </Section>

      <Section title="14. Contact">
        <P>
          For questions about these terms, contact us at{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-text underline underline-offset-4 hover:text-text-muted transition-colors"
          >
            {supportEmail}
          </a>
          .
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
