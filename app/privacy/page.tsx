import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-16">
        {/* HEADER */}
        <header className="mb-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="TOTS-OS"
              className="h-10 w-10 rounded-xl object-contain"
            />

            <span className="text-xs font-medium uppercase tracking-[0.35em] text-white/70">
              TOTS-OS
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/30 hover:text-white"
          >
            Back Home
          </Link>
        </header>

        {/* INTRO */}
        <section className="mb-14">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/35">
            Legal
          </p>

          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Privacy Policy
          </h1>

          <p className="mt-6 text-sm text-white/40">
            Last updated: 8 August 2026
          </p>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-white/60">
            This Privacy Policy explains how TOTS-OS collects, uses,
            stores and protects personal information when you use our
            website, platform and connected services.
          </p>
        </section>

        <div className="space-y-6">
          <PolicySection title="1. Who we are">
            <p>
              TOTS-OS is a business operating system provided by The
              Organised Types.
            </p>

            <p>
              If you have questions about this Privacy Policy or how
              your personal information is handled, you can contact us
              at:
            </p>

            <p>
              <a
                href="mailto:hello@theorganisedtypes.co.uk"
                className="text-white underline underline-offset-4"
              >
                hello@theorganisedtypes.co.uk
              </a>
            </p>
          </PolicySection>

          <PolicySection title="2. Information we collect">
            <p>
              Depending on how you use TOTS-OS, we may collect the
              following types of information:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Account information, such as your name, email address
                and authentication details.
              </li>

              <li>
                Profile and business information you choose to add to
                your TOTS-OS account.
              </li>

              <li>
                Contacts, organisations, projects, tasks, notes,
                events and other business information you enter into
                the platform.
              </li>

              <li>
                Social media connection information when you choose
                to connect a supported social platform.
              </li>

              <li>
                Authentication tokens and connection identifiers
                required to provide connected social media features.
              </li>

              <li>
                Content and scheduling information you provide when
                using social media publishing or scheduling tools.
              </li>

              <li>
                Technical information such as browser type, device
                information, IP address, application logs and
                security-related information.
              </li>

              <li>
                Information you provide when contacting us for
                support or submitting a form.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="3. How we use your information">
            <p>We may use personal information to:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Create and manage your TOTS-OS account.</li>

              <li>
                Provide the tools and services available within
                TOTS-OS.
              </li>

              <li>
                Save and organise the business information you choose
                to enter into the platform.
              </li>

              <li>
                Connect your account with third-party services that
                you explicitly authorise.
              </li>

              <li>
                Publish or schedule content when you request that
                TOTS-OS performs those actions.
              </li>

              <li>
                Maintain the security, reliability and performance of
                the platform.
              </li>

              <li>
                Respond to customer support requests and communicate
                important service information.
              </li>

              <li>
                Comply with legal and regulatory obligations.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="4. TikTok and social media integrations">
            <p>
              TOTS-OS may allow you to connect third-party social
              media accounts, including TikTok.
            </p>

            <p>
              When you choose to connect a social media account, the
              relevant platform may provide TOTS-OS with information
              permitted by the permissions you approve during the
              authorisation process.
            </p>

            <p>
              This may include account identifiers, profile
              information, access tokens and permissions needed to
              provide the requested integration.
            </p>

            <p>
              TOTS-OS will only use this information to provide the
              connected functionality that you have requested, such
              as account connection, content publishing or social
              media scheduling.
            </p>

            <p>
              Your use of third-party platforms is also governed by
              the privacy policies and terms of those platforms.
            </p>
          </PolicySection>

          <PolicySection title="5. Legal bases for processing">
            <p>
              Where UK data protection law applies, we process
              personal data only where we have an appropriate legal
              basis.
            </p>

            <p>These may include:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Performance of a contract, where processing is needed
                to provide TOTS-OS to you.
              </li>

              <li>
                Legitimate interests, where necessary to operate,
                secure and improve our services.
              </li>

              <li>
                Consent, where you have actively chosen to provide
                consent.
              </li>

              <li>
                Legal obligation, where processing is required by
                law.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="6. How we store and protect information">
            <p>
              We take reasonable technical and organisational
              measures to protect personal information against
              unauthorised access, loss, misuse or disclosure.
            </p>

            <p>
              TOTS-OS uses third-party infrastructure and service
              providers to operate parts of the platform. This
              includes services used for database hosting,
              authentication, website hosting, email communications
              and integrations.
            </p>

            <p>
              No internet-based service can guarantee complete
              security, but we take reasonable steps to protect the
              information entrusted to us.
            </p>
          </PolicySection>

          <PolicySection title="7. Service providers">
            <p>
              We may use trusted third-party service providers to
              help operate TOTS-OS.
            </p>

            <p>These may include providers for:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Database hosting and authentication.</li>
              <li>Website and application hosting.</li>
              <li>Email and mailing-list services.</li>
              <li>Analytics and application monitoring.</li>
              <li>Social media integrations.</li>
            </ul>

            <p>
              These providers may process information only as
              necessary to provide their services to us and are
              subject to their own contractual and legal
              responsibilities.
            </p>
          </PolicySection>

          <PolicySection title="8. Data retention">
            <p>
              We retain personal information only for as long as
              reasonably necessary for the purposes described in this
              Privacy Policy, including providing the service,
              meeting legal obligations, resolving disputes and
              maintaining security.
            </p>

            <p>
              If you close your account, certain information may
              continue to be retained where required for legitimate
              business, security or legal purposes.
            </p>
          </PolicySection>

          <PolicySection title="9. Your rights">
            <p>
              Depending on the law that applies to you, you may have
              rights regarding your personal information, including
              the right to:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Request access to your personal information.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your information.</li>
              <li>Request restriction of certain processing.</li>
              <li>Object to certain processing.</li>
              <li>
                Request transfer of certain information in a portable
                format.
              </li>
              <li>
                Withdraw consent where processing is based on
                consent.
              </li>
            </ul>

            <p>
              To exercise any applicable privacy rights, contact us
              at{" "}
              <a
                href="mailto:hello@theorganisedtypes.co.uk"
                className="text-white underline underline-offset-4"
              >
                hello@theorganisedtypes.co.uk
              </a>
              .
            </p>
          </PolicySection>

          <PolicySection title="10. Account and social connection deletion">
            <p>
              You may disconnect supported social media accounts from
              TOTS-OS through the relevant account or settings
              features where available.
            </p>

            <p>
              You may also request deletion of your TOTS-OS account
              and associated personal information by contacting us.
            </p>

            <p>
              Where a third-party platform provides its own controls
              for removing application permissions, you can also
              revoke TOTS-OS access through that platform.
            </p>
          </PolicySection>

          <PolicySection title="11. Cookies and similar technologies">
            <p>
              TOTS-OS may use cookies or similar technologies where
              necessary for authentication, security, preferences and
              the operation of the platform.
            </p>

            <p>
              Where required by law, non-essential cookies will only
              be used with appropriate consent.
            </p>
          </PolicySection>

          <PolicySection title="12. International transfers">
            <p>
              Some service providers used by TOTS-OS may process
              information outside the United Kingdom.
            </p>

            <p>
              Where required, we take appropriate measures designed
              to ensure that international transfers of personal
              information are protected in accordance with
              applicable data protection law.
            </p>
          </PolicySection>

          <PolicySection title="13. Children's privacy">
            <p>
              TOTS-OS is intended for business users and is not
              directed at children.
            </p>

            <p>
              We do not knowingly collect personal information from
              children where doing so would be prohibited by
              applicable law.
            </p>
          </PolicySection>

          <PolicySection title="14. Changes to this Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time to
              reflect changes to TOTS-OS, our integrations or
              applicable legal requirements.
            </p>

            <p>
              When we make changes, we will update the date shown at
              the top of this page.
            </p>
          </PolicySection>

          <PolicySection title="15. Contact us">
            <p>
              If you have questions, concerns or requests relating to
              this Privacy Policy or your personal information,
              contact:
            </p>

            <p>
              <strong className="text-white">The Organised Types / TOTS-OS</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:hello@theorganisedtypes.co.uk"
                className="text-white underline underline-offset-4"
              >
                hello@theorganisedtypes.co.uk
              </a>
            </p>
          </PolicySection>
        </div>

        <footer className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} TOTS-OS. All rights reserved.</p>

          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>

            <Link href="/" className="hover:text-white">
              Home
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-7 md:p-9">
      <h2 className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      <div className="mt-5 space-y-4 text-sm leading-7 text-white/55 md:text-base">
        {children}
      </div>
    </section>
  );
}