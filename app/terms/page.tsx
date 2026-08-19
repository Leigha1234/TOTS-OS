import Link from "next/link";

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>

          <p className="mt-6 text-sm text-white/40">
            Last updated: 8 August 2026
          </p>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-white/60">
            These Terms of Service govern your access to and use of
            the TOTS-OS website, platform, features and connected
            services.
          </p>
        </section>

        <div className="space-y-6">
          <TermsSection title="1. About TOTS-OS">
            <p>
              TOTS-OS is a business operating system provided by The
              Organised Types.
            </p>

            <p>
              TOTS-OS provides tools designed to help users organise
              and manage business activities, which may include
              contacts, organisations, projects, tasks, calendars,
              planning, social media and related business
              information.
            </p>
          </TermsSection>

          <TermsSection title="2. Acceptance of these Terms">
            <p>
              By accessing or using TOTS-OS, you agree to these Terms
              of Service.
            </p>

            <p>
              If you do not agree to these Terms, you must not use
              TOTS-OS.
            </p>
          </TermsSection>

          <TermsSection title="3. Eligibility and accounts">
            <p>
              You are responsible for ensuring that you are legally
              permitted to use TOTS-OS and enter into these Terms.
            </p>

            <p>
              You must provide accurate account information and keep
              your login credentials secure.
            </p>

            <p>
              You are responsible for activity carried out through
              your account unless the activity results from a
              security failure for which TOTS-OS is responsible.
            </p>
          </TermsSection>

          <TermsSection title="4. Acceptable use">
            <p>You must not use TOTS-OS to:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Break any applicable law or regulation.</li>

              <li>
                Infringe another person's intellectual property,
                privacy or other legal rights.
              </li>

              <li>
                Distribute malicious software, viruses or harmful
                code.
              </li>

              <li>
                Attempt to gain unauthorised access to TOTS-OS,
                another user's account or connected systems.
              </li>

              <li>
                Interfere with or disrupt the security, integrity or
                performance of the platform.
              </li>

              <li>
                Use automated methods to improperly scrape, overload
                or exploit the platform.
              </li>

              <li>
                Use connected social media services in a way that
                violates the rules or terms of those services.
              </li>

              <li>
                Upload, publish or distribute content that you do not
                have the legal right to use.
              </li>
            </ul>
          </TermsSection>

          <TermsSection title="5. Your content and business data">
            <p>
              You retain ownership of content and business
              information that you submit to TOTS-OS.
            </p>

            <p>
              You grant us the limited rights necessary to host,
              process, store, display and transmit that information
              solely as required to operate and provide TOTS-OS.
            </p>

            <p>
              You are responsible for ensuring that you have the
              necessary rights and lawful basis to enter, upload or
              process information through TOTS-OS.
            </p>
          </TermsSection>

          <TermsSection title="6. Social media integrations">
            <p>
              TOTS-OS may allow you to connect accounts from
              third-party platforms, including TikTok and other
              supported social media services.
            </p>

            <p>
              Connecting a third-party account is optional and
              requires your authorisation.
            </p>

            <p>
              When you connect an account, you authorise TOTS-OS to
              perform the actions you request within the permissions
              granted by that third-party service.
            </p>

            <p>
              These actions may include obtaining permitted account
              information and publishing or scheduling content at
              your direction.
            </p>

            <p>
              Your use of a third-party service remains subject to
              that provider's own terms, policies and rules.
            </p>
          </TermsSection>

          <TermsSection title="7. Responsibility for published content">
            <p>
              You are responsible for reviewing and approving any
              content you choose to publish or schedule through
              TOTS-OS.
            </p>

            <p>
              You are responsible for ensuring your content complies
              with applicable laws, intellectual property rules,
              advertising requirements and the rules of the relevant
              social media platform.
            </p>
          </TermsSection>

          <TermsSection title="8. Third-party services">
            <p>
              TOTS-OS relies on and may integrate with services
              operated by third parties.
            </p>

            <p>
              We do not control third-party services and cannot
              guarantee that they will always remain available,
              unchanged or compatible with TOTS-OS.
            </p>

            <p>
              Features may be affected if a third party changes,
              restricts or removes access to its API, service or
              functionality.
            </p>
          </TermsSection>

          <TermsSection title="9. Availability and changes">
            <p>
              We aim to provide a reliable service, but we do not
              guarantee that TOTS-OS will always be available without
              interruption or error.
            </p>

            <p>
              We may modify, update, replace or discontinue features
              where reasonably necessary to maintain, improve or
              develop the service.
            </p>
          </TermsSection>

          <TermsSection title="10. Security">
            <p>
              You must take reasonable steps to protect your account
              credentials and immediately notify us if you believe
              your account has been compromised.
            </p>

            <p>
              You must not attempt to bypass security measures or
              access data, accounts or systems that you are not
              authorised to access.
            </p>
          </TermsSection>

          <TermsSection title="11. Intellectual property">
            <p>
              TOTS-OS, including its software, interface, branding,
              design, documentation and original content, is owned by
              or licensed to The Organised Types.
            </p>

            <p>
              These Terms do not transfer ownership of TOTS-OS or its
              intellectual property to you.
            </p>

            <p>
              You may not copy, reproduce, reverse engineer,
              redistribute or commercially exploit TOTS-OS except
              where expressly permitted by law or authorised by us.
            </p>
          </TermsSection>

          <TermsSection title="12. Suspension and termination">
            <p>
              We may suspend or terminate access to TOTS-OS where
              reasonably necessary, including where:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>These Terms have been materially breached.</li>

              <li>
                Use of the platform presents a security or legal
                risk.
              </li>

              <li>
                Your use threatens the operation or integrity of the
                service.
              </li>
            </ul>

            <p>
              You may stop using TOTS-OS at any time and may request
              account deletion by contacting us.
            </p>
          </TermsSection>

          <TermsSection title="13. Disclaimers">
            <p>
              TOTS-OS is provided as a business organisation and
              productivity tool.
            </p>

            <p>
              Information made available through TOTS-OS does not
              constitute legal, financial, accounting or other
              professional advice.
            </p>

            <p>
              You remain responsible for business decisions made
              using information stored or displayed within TOTS-OS.
            </p>
          </TermsSection>

          <TermsSection title="14. Limitation of liability">
            <p>
              Nothing in these Terms excludes or limits liability
              where doing so would be unlawful.
            </p>

            <p>
              To the extent permitted by law, TOTS-OS and The
              Organised Types will not be responsible for indirect or
              consequential losses arising from your use of the
              platform.
            </p>

            <p>
              We are not responsible for losses caused by third-party
              platforms, services or integrations outside our
              reasonable control.
            </p>
          </TermsSection>

          <TermsSection title="15. Privacy">
            <p>
              Our collection and use of personal information is
              described in our Privacy Policy.
            </p>

            <p>
              <Link
                href="/privacy"
                className="text-white underline underline-offset-4"
              >
                Read the TOTS-OS Privacy Policy
              </Link>
            </p>
          </TermsSection>

          <TermsSection title="16. Changes to these Terms">
            <p>
              We may update these Terms from time to time where
              necessary to reflect changes to TOTS-OS, legal
              requirements or our services.
            </p>

            <p>
              The latest version will be published on this page with
              the updated date.
            </p>
          </TermsSection>

          <TermsSection title="17. Governing law">
            <p>
              These Terms are governed by the laws of Scotland,
              subject to any mandatory consumer or other legal rights
              that apply to you.
            </p>

            <p>
              Any dispute will be subject to the jurisdiction of the
              Scottish courts, except where applicable law gives you
              the right to bring proceedings elsewhere.
            </p>
          </TermsSection>

          <TermsSection title="18. Contact us">
            <p>
              If you have questions about these Terms, contact:
            </p>

            <p>
              <strong className="text-white">
                The Organised Types / TOTS-OS
              </strong>
              <br />
              Email:{" "}
              <a
                href="mailto:hello@theorganisedtypes.co.uk"
                className="text-white underline underline-offset-4"
              >
                hello@theorganisedtypes.co.uk
              </a>
            </p>
          </TermsSection>
        </div>

        <footer className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} TOTS-OS. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
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

function TermsSection({
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