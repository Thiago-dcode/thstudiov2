import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Privacy Policy — A11STUDIO",
    description: "How A11STUDIO collects, uses, and protects your personal data.",
}

const LAST_UPDATED = "March 16, 2026"

export default function PrivacyPolicyPage() {
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
                    A11STUDIO (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the data
                    controller responsible for your personal data. For any privacy-related
                    inquiries, contact us at{" "}
                    <A href="mailto:contact@a11studio.com">contact@a11studio.com</A>.
                </P>
            </Section>

            <Section title="2. Personal Data We Collect">
                <P>
                    We collect the following categories of data depending on how you
                    interact with the platform:
                </P>

                <SubSection title="Account Information">
                    <P>
                        When you register, we collect your <strong>name</strong>,{" "}
                        <strong>surname</strong>, <strong>email address</strong>,{" "}
                        <strong>username</strong>, and a hashed version of your{" "}
                        <strong>password</strong>. You may optionally provide a{" "}
                        <strong>profession</strong>, <strong>biography</strong>,{" "}
                        <strong>short biography</strong>, <strong>avatar image</strong>, and{" "}
                        <strong>banner image</strong>.
                    </P>
                </SubSection>

                <SubSection title="Address Data">
                    <P>
                        If you choose to add an address to your profile, we store your{" "}
                        <strong>street</strong>, <strong>city</strong>, <strong>state</strong>,{" "}
                        <strong>postal code</strong>, <strong>country</strong>, and geographic{" "}
                        <strong>coordinates</strong> (latitude and longitude) to display your
                        location on your public profile.
                    </P>
                </SubSection>

                <SubSection title="Media & Portfolio Content">
                    <P>
                        When you upload media, we store the <strong>file</strong>, its{" "}
                        <strong>size</strong>, <strong>format</strong>,{" "}
                        <strong>thumbnail</strong>, and optional <strong>SEO metadata</strong>{" "}
                        (title, description, alt text, filename). Your portfolios, collections,
                        services, and projects include titles, descriptions, thumbnails, and
                        pricing information you provide.
                    </P>
                </SubSection>

                <SubSection title="Business & Client Data">
                    <P>
                        If you manage clients through the platform, we store{" "}
                        <strong>client names</strong>, <strong>email addresses</strong>,{" "}
                        <strong>phone numbers</strong>, <strong>websites</strong>, and{" "}
                        <strong>logos</strong> that you provide. Project data includes budgets,
                        dates, and status information.
                    </P>
                </SubSection>

                <SubSection title="Contact Form Submissions">
                    <P>
                        When visitors contact an artist through the platform, we collect the
                        sender&apos;s <strong>name</strong>, <strong>email address</strong>,{" "}
                        <strong>subject</strong>, and <strong>message content</strong>.
                    </P>
                </SubSection>

                <SubSection title="Authentication & Security Data">
                    <P>
                        To secure your account, we collect your{" "}
                        <strong>IP address</strong> and <strong>user agent</strong> (browser
                        and device information) when you sign in. We also store session tokens
                        and, if enabled, two-factor authentication codes with their expiration
                        timestamps.
                    </P>
                </SubSection>
            </Section>

            <Section title="3. Payment Data">
                <P>
                    Subscription payments are processed by third-party providers —{" "}
                    <strong>Stripe</strong> and <strong>PayPal</strong>. We store
                    references to your customer and subscription identifiers on these
                    platforms, along with billing amounts and dates. We do{" "}
                    <strong>not</strong> store your credit card numbers, bank account
                    details, or other raw payment credentials. These are handled entirely
                    by the payment processor under their own privacy policies.
                </P>
            </Section>

            <Section title="4. AI Processing Data">
                <P>
                    A11STUDIO uses artificial intelligence for two purposes:
                </P>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
                    <li>
                        <strong>AI-assisted features</strong> — such as generating SEO
                        metadata for your media. We track token usage per request (model
                        used, token count) to manage your AI credit allocation.
                    </li>
                    <li>
                        <strong>Content moderation</strong> — uploaded media is automatically
                        reviewed for policy compliance. We store the moderation decision,
                        severity level, content type, and reason.
                    </li>
                </ul>
                <P>
                    AI processing is performed by third-party LLM providers. Only the
                    minimum data necessary is sent for processing.
                </P>
            </Section>

            <Section title="5. How We Use Your Data">
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
                    <li>Providing and operating the portfolio platform</li>
                    <li>Authenticating your identity and securing your account</li>
                    <li>Processing subscription payments and managing billing</li>
                    <li>Delivering AI-assisted features (SEO generation, content suggestions)</li>
                    <li>Enforcing content policies through automated moderation</li>
                    <li>Sending transactional emails (verification, password recovery, 2FA codes)</li>
                    <li>Displaying your public artist profile, portfolios, and services</li>
                    <li>Delivering contact form messages from visitors to artists</li>
                    <li>Sending notifications about account activity</li>
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
                    Authentication logs (IP addresses, device information) are retained for
                    security purposes. Payment records are retained as required by
                    applicable tax and financial regulations. When you delete your account,
                    we remove your personal data, media files, and associated content
                    within a reasonable timeframe, except where retention is required by
                    law.
                </P>
            </Section>

            <Section title="8. Your Rights">
                <P>
                    Depending on your jurisdiction, you may have the following rights
                    regarding your personal data:
                </P>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
                    <li><strong>Access</strong> — request a copy of the data we hold about you</li>
                    <li><strong>Rectification</strong> — correct inaccurate or incomplete data</li>
                    <li><strong>Erasure</strong> — request deletion of your personal data</li>
                    <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format</li>
                    <li><strong>Restriction</strong> — request that we limit processing of your data</li>
                    <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
                </ul>
                <P>
                    To exercise any of these rights, contact us at{" "}
                    <A href="mailto:contact@a11studio.com">contact@a11studio.com</A>.
                </P>
            </Section>

            <Section title="9. Security">
                <P>
                    We implement industry-standard security measures including password
                    hashing, encrypted session tokens, two-factor authentication, device
                    tracking, and HTTPS encryption. While no system is completely immune to
                    breaches, we take reasonable steps to protect your data.
                </P>
            </Section>

            <Section title="10. Cookies">
                <P>
                    We use cookies for essential platform functionality. For full details,
                    see our <Link href="/legal/cookies" className="text-text underline underline-offset-4 hover:text-accent transition-colors">Cookie Policy</Link>.
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
                    <A href="mailto:contact@a11studio.com">contact@a11studio.com</A>.
                </P>
            </Section>
        </>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
            {children}
        </section>
    )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                {title}
            </h3>
            {children}
        </div>
    )
}

function P({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm leading-relaxed text-text-muted">{children}</p>
    )
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="text-text underline underline-offset-4 hover:text-accent transition-colors"
        >
            {children}
        </a>
    )
}
