import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Cookie Policy — A11STUDIO",
    description: "How A11STUDIO uses cookies and similar technologies.",
}

const LAST_UPDATED = "March 16, 2026"

export default function CookiePolicyPage() {
    return (
        <>
            <header className="space-y-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                    Last updated — {LAST_UPDATED}
                </p>
                <h1 className="text-3xl tablet:text-4xl font-bold tracking-tight text-text">
                    Cookie Policy
                </h1>
                <p className="text-sm leading-relaxed text-text-muted max-w-2xl">
                    This policy explains what cookies the A11STUDIO platform uses, why we
                    use them, and how they affect your experience. We only use cookies that
                    are necessary for the platform to function.
                </p>
            </header>

            <Section title="1. What Are Cookies">
                <P>
                    Cookies are small text files stored on your device by your web browser.
                    They allow the platform to remember your session, preferences, and
                    security state between page visits. A11STUDIO uses only{" "}
                    <strong>first-party, HTTP-only cookies</strong> — we do not use
                    advertising or tracking cookies.
                </P>
            </Section>

            <Section title="2. Essential Cookies">
                <P>
                    These cookies are strictly necessary for the platform to function. They
                    cannot be disabled without breaking core functionality.
                </P>

                <CookieTable
                    cookies={[
                        {
                            name: "Session",
                            purpose: "Stores your encrypted authentication token to keep you signed in across pages.",
                            duration: "1 day",
                        },
                        {
                            name: "Session Expiration",
                            purpose: "Tracks when your current session expires so the platform can refresh it seamlessly.",
                            duration: "1 day",
                        },
                        {
                            name: "Two-Factor Authentication",
                            purpose: "Temporarily holds your 2FA verification state during the sign-in flow.",
                            duration: "10 minutes",
                        },
                        {
                            name: "Language",
                            purpose: "Stores your preferred language so content is displayed in the correct locale.",
                            duration: "Session",
                        },
                    ]}
                />
            </Section>

            <Section title="3. Functional Cookies">
                <P>
                    These cookies enhance your experience by remembering choices you have
                    made. They are set only in response to actions you take on the
                    platform.
                </P>

                <CookieTable
                    cookies={[
                        {
                            name: "Remember Me",
                            purpose: "Keeps your session active for an extended period so you don't have to sign in repeatedly.",
                            duration: "30 days",
                        },
                        {
                            name: "Subscription Flow",
                            purpose: "Temporarily stores subscription state during the checkout process with Stripe or PayPal.",
                            duration: "7 minutes",
                        },
                        {
                            name: "Password Recovery",
                            purpose: "Maintains state during the password reset flow to validate your recovery request.",
                            duration: "Short-lived",
                        },
                    ]}
                />
            </Section>

            <Section title="4. Third-Party Cookies">
                <P>
                    When you interact with payment providers during checkout,{" "}
                    <strong>Stripe</strong> and <strong>PayPal</strong> may set their own
                    cookies on your device. These cookies are governed by the respective
                    provider&apos;s cookie and privacy policies:
                </P>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
                    <li>
                        <a
                            href="https://stripe.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text underline underline-offset-4 hover:text-accent transition-colors"
                        >
                            Stripe Privacy Policy
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://www.paypal.com/webapps/mpp/ua/privacy-full"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text underline underline-offset-4 hover:text-accent transition-colors"
                        >
                            PayPal Privacy Policy
                        </a>
                    </li>
                </ul>
            </Section>

            <Section title="5. What We Do Not Use">
                <P>
                    A11STUDIO does <strong>not</strong> use:
                </P>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
                    <li>Analytics or tracking cookies</li>
                    <li>Advertising or retargeting cookies</li>
                    <li>Social media tracking pixels</li>
                    <li>Cross-site tracking technologies</li>
                </ul>
            </Section>

            <Section title="6. Managing Cookies">
                <P>
                    You can manage or delete cookies through your browser settings.
                    Disabling essential cookies will prevent you from signing in and using
                    authenticated features of the platform. For more information on
                    managing cookies, consult your browser&apos;s documentation.
                </P>
            </Section>

            <Section title="7. Relationship to Privacy Policy">
                <P>
                    This Cookie Policy is part of our broader{" "}
                    <Link
                        href="/legal/privacy"
                        className="text-text underline underline-offset-4 hover:text-accent transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    . For details on how we collect, use, and protect your personal data
                    beyond cookies, please review it.
                </P>
            </Section>

            <Section title="8. Contact">
                <P>
                    If you have questions about our use of cookies, contact us at{" "}
                    <a
                        href="mailto:contact@a11studio.com"
                        className="text-text underline underline-offset-4 hover:text-accent transition-colors"
                    >
                        contact@a11studio.com
                    </a>.
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

function P({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm leading-relaxed text-text-muted">{children}</p>
    )
}

function CookieTable({ cookies }: {
    cookies: { name: string; purpose: string; duration: string }[]
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-fg-2">
                        <th className="text-left py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                            Cookie
                        </th>
                        <th className="text-left py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                            Purpose
                        </th>
                        <th className="text-left py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                            Duration
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {cookies.map((cookie) => (
                        <tr key={cookie.name} className="border-b border-fg-2/50">
                            <td className="py-3 pr-4 text-text font-medium whitespace-nowrap">
                                {cookie.name}
                            </td>
                            <td className="py-3 pr-4 text-text-muted leading-relaxed">
                                {cookie.purpose}
                            </td>
                            <td className="py-3 text-text-muted whitespace-nowrap">
                                {cookie.duration}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
