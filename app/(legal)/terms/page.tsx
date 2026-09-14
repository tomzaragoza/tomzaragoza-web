import type { Metadata } from "next";
import Link from "next/link";

const description = "Terms for using tomzaragoza.com and its educational content.";

export const metadata: Metadata = {
  title: "Terms of Use | Tom Zaragoza",
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use | Tom Zaragoza",
    description,
    url: "/terms"
  }
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p>Last updated: September 13, 2026</p>
      <p>
        These terms apply to your use of tomzaragoza.com, operated by Tom Zaragoza,
        including its course content and account features. By using the site, you
        agree to these terms. If you do not agree, do not use the site.
      </p>

      <h2>Using the site</h2>
      <p>
        Use the site lawfully. Do not interfere with its operation, attempt to
        access accounts or restricted resources without permission, distribute
        malicious software, or use the site to violate another person&apos;s rights.
        Access may be limited or suspended to address misuse or security risks.
      </p>

      <h2>Your account</h2>
      <p>
        Some features use Google sign-in. You are responsible for keeping your
        Google account secure and for activity you authorize through your account.
        Do not share access to another person&apos;s account. Contact Tom if you
        believe your account has been used without permission.
      </p>

      <h2>Content and permitted use</h2>
      <p>
        Unless otherwise stated, site content belongs to Tom Zaragoza or its
        respective owners. You may read the content and apply the lessons to your
        own work or business. You may share links to the site. You must obtain
        permission before republishing, reselling, or distributing the course
        content, except where applicable law or a stated license allows it.
        Separate license terms supplied with a download continue to apply.
      </p>

      <h2>Educational information</h2>
      <p>
        The course and other materials provide general educational information.
        They do not guarantee advertising approval, customers, revenue, profit,
        or any particular result. You are responsible for your campaigns,
        spending, and business decisions. Check the current rules of each
        advertising platform before you act on a lesson.
      </p>

      <h2>External services</h2>
      <p>
        Links to other websites and references to products are provided for
        convenience. External services have their own terms and privacy policies.
        Tom Zaragoza does not control their content, availability, or operation.
        References to Google or X do not imply sponsorship or endorsement.
      </p>

      <h2>Availability and responsibility</h2>
      <p>
        The site and its content are provided as available. Content may contain
        errors or become outdated, and features may change or stop operating.
        To the extent permitted by applicable law, Tom Zaragoza makes no warranty
        of uninterrupted access, accuracy, or fitness for a particular purpose,
        and is not liable for indirect or consequential losses arising from use
        of the site. Nothing in these terms excludes rights or liability that
        cannot lawfully be excluded.
      </p>

      <h2>Privacy</h2>
      <p>
        The <Link href="/privacy">Privacy Policy</Link> explains how personal
        information is handled when you use the site.
      </p>

      <h2>Changes and contact</h2>
      <p>
        These terms may be updated as the site changes. The latest version and
        update date will appear on this page. For questions or permission to use
        content, contact{" "}
        <a href="https://www.linkedin.com/in/tomzaragoza/">
          Tom Zaragoza on LinkedIn
        </a>.
      </p>
    </>
  );
}
