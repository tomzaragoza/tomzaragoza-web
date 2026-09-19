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
      <p>Last updated: September 18, 2026</p>
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
        <li>
          If you buy the course, Stripe collects your email address and payment
          details. This site records your email address, selected plan, payment
          amount, currency, and Stripe purchase identifiers. It uses your email
          address to connect a guest purchase to a later verified sign-in.
        </li>
      </ul>

      <h2>Website analytics</h2>
      <p>
        This site uses PostHog to understand page visits, navigation, and
        interactions with page elements. Analytics can include visited URLs,
        referring websites, browser and device information, and approximate
        location derived from your IP address. A browser identifier connects
        visits from the same browser. If you sign in, your account identifier
        connects that activity to your account. The site resets the analytics
        identity after sign-out. Session recording is disabled, and captured
        element text and attributes are masked.
      </p>
      <p>
        The X Pixel sends page visits, buy-button submissions, and confirmed
        purchases to X to measure advertising results. A buy-button event
        includes the selected plan and price. A purchase event includes your
        checkout email address, payment amount, currency, and a purchase event
        identifier. X uses these details to measure purchases. The X Pixel
        hashes the email address before it sends the event to X.
      </p>

      <h2>How information is used</h2>
      <p>
        Account information is used to sign you in, display your account identity,
        and manage your session. Technical information helps operate the site,
        diagnose errors, and prevent unauthorized access.
      </p>

      <h2>Cookies</h2>
      <p>
        Cookies are small pieces of data stored by your browser. This site uses
        cookies for sign-in and session security. PostHog uses cookies and local
        browser storage to recognize returning browsers. You can clear or block cookies
        in your browser, but sign-in features may stop working. The course
        introduction is public. During the presale, course lessons are limited
        to two preview accounts.
      </p>

      <h2>Service providers and disclosure</h2>
      <p>
        Google processes information when you use Google sign-in under its own{" "}
        <a href="https://policies.google.com/privacy">privacy policy</a>.
        {" "}Stripe processes course payments. PostHog processes analytics data through its US Cloud service. See
        its <a href="https://posthog.com/privacy">privacy policy</a>.{" "}
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
