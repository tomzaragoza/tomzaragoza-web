import type { Metadata } from "next";

const description = "How Tom Zaragoza handles personal information on tomzaragoza.com.";

export const metadata: Metadata = {
  title: "Privacy Policy | Tom Zaragoza",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | Tom Zaragoza",
    description,
    url: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: September 13, 2026</p>
      <p>
        This policy explains how Tom Zaragoza handles personal information on
        tomzaragoza.com. It covers this website, its course pages, and its sign-in
        features. Other websites linked here have their own privacy policies.
      </p>

      <h2>Information collected</h2>
      <ul>
        <li>
          If you sign in with Google, the site receives account information such
          as your name, email address, profile image, and Google account identifier.
          It stores account and session records to recognize you when you return.
          Google handles your Google password; this site does not receive it.
        </li>
        <li>
          Sign-in records can include your IP address, browser information, and
          the times when your account and sessions were created or updated.
        </li>
        <li>
          Hosting services may process technical information, such as your IP
          address, requested pages, and request times, to deliver and protect the
          website.
        </li>
        <li>
          If you contact Tom, your message and the contact details you provide
          are used to respond to your request.
        </li>
      </ul>

      <h2>How information is used</h2>
      <p>
        Account information is used to sign you in, display your account identity,
        and manage your session. Technical information helps operate the site,
        diagnose errors, and prevent unauthorized access.
      </p>

      <h2>Cookies</h2>
      <p>
        Cookies are small pieces of data stored by your browser. This site uses
        cookies for sign-in and session security. You can clear or block cookies
        in your browser, but sign-in features may stop working. You can read the
        public course pages without signing in.
      </p>

      <h2>Service providers and disclosure</h2>
      <p>
        Google processes information when you use Google sign-in under its own{" "}
        <a href="https://policies.google.com/privacy">privacy policy</a>.
        Hosting and database services process information needed to operate the
        site. Depending on their infrastructure, information may be processed
        outside the country where you live. Information may also be disclosed
        when required by law or to address fraud, security incidents, or misuse.
      </p>

      <h2>Storage and security</h2>
      <p>
        Account records are stored to support your account. Session records
        support sign-in until they expire or are revoked. Security measures help
        protect stored information, but no online service can guarantee complete
        security. You can request deletion of your account information using the
        contact link below. Some records may need to be retained to meet legal
        obligations or resolve security issues.
      </p>

      <h2>Your choices and requests</h2>
      <p>
        You can use public pages without an account, sign out at any time, and
        remove this site&apos;s access in your Google account settings. Removing
        Google access does not itself delete records already stored by this site.
        To request access to, correction of, or deletion of your personal
        information, contact Tom. Your identity may need to be verified before a
        request can be completed. Do not send passwords or other sensitive details
        in your initial message.
      </p>

      <h2>Changes and contact</h2>
      <p>
        Updates to this policy will appear here with a revised date. For privacy
        questions or requests, contact{" "}
        <a href="https://www.linkedin.com/in/tomzaragoza/">
          Tom Zaragoza on LinkedIn
        </a>.
      </p>
    </>
  );
}
