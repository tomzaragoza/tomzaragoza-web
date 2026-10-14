# Tom Zaragoza Web

Minimal Next.js homepage for Tom Zaragoza, with a CMS-backed MCP endpoint at `/mcp`.

## Development

```bash
npm install
npm run dev
```

The MCP endpoint exposes one tool:

- `get_summary`: returns `building things on the internet`

Endpoint definitions live in `content/endpoints.json`.

## PostHog analytics

PostHog starts in `instrumentation-client.ts`. It captures page views, including
navigation between course pages, and interactions with page elements. Text and
element attributes are masked. Session recording is enabled. Admin page events
are excluded.

Set `NEXT_PUBLIC_POSTHOG_KEY` to the project token and
`NEXT_PUBLIC_POSTHOG_HOST` to `https://us.i.posthog.com` for US Cloud. Set these
in `.env` locally and in the hosting environment before building for production.
Next.js includes these public values in the browser code at build time.
`POSTHOG_PROJECT_ID` is a reference value and is not needed by the browser SDK.
When the project token is absent, analytics does not start.

Anonymous visitor IDs persist in browser storage. After sign-in, analytics uses
the account ID. It resets the identity after sign-out or an account change.
Names and email addresses are not sent as account properties.
PostHog can add approximate location to events from the visitor's IP address,
subject to the project's geographic data settings.

### Course pricing and checkout

The Course presale price is $20 USD, reduced from $49 USD. The Pro presale
price is $99 USD, reduced from $198 USD. The presale ends on October 16,
2026 at 11:59 p.m. Eastern Time. The server changes both Checkout prices to
their regular amounts at that time. Both plans use fixed USD prices in every
region. The previous PostHog regional pricing flag is not used for this offer.

Pro includes the course and one 30-minute consultation with Tom.
Course and Pro customers can read published lessons after signing in with
their purchase email. Complimentary accounts retain lesson access.
Users without a purchase cannot read lesson content or private course media.
After sign-in, `/x-ads` opens the first course section. The sidebar lists
sections and their child pages. Each section shows its video and written
lesson in the main content area. The customer reader has no messaging or
ad-library navigation. Existing private conversations remain stored, with
the administration interface available to Tom.

Checkout does not require sign-in. Stripe collects an email address from guest
buyers. Stripe redirects through `/api/stripe/checkout/success`, which places
the Checkout Session ID in a short-lived HTTP-only cookie and redirects to a
clean completion URL. The completion page verifies the paid Checkout Session
and stores the purchase in MongoDB. The webhook performs the same idempotent update if the
customer closes the browser before returning. A signed-in purchase is linked
to its account. A guest purchase becomes available to a later Google sign-in
with the same verified email address. A later Course purchase cannot reduce
existing Pro access.

Create a Stripe webhook endpoint for `/api/stripe/webhook`. Subscribe it to
`checkout.session.completed` and `checkout.session.async_payment_succeeded`.
Store its signing secret in `STRIPE_WEBHOOK_SECRET`. The route verifies every
Stripe signature before it writes an entitlement.

Checkout creates inline Stripe prices from the amounts in
`lib/x-ads-offer.ts`. The checkout route accepts the Course or Pro product
key. It selects the charge on the server and records the selected product and
offer period in Checkout metadata.

The X Ads base pixel uses ID `o6ml8` on every page. The checkout event uses
`tw-o6ml8-rfgj8` when a visitor submits any Course or Pro buy button. The purchase event
uses `tw-o6ml8-rfgj9` on `/x-ads/checkout-complete` after Stripe confirms
payment. The checkout event sends an empty data object. The
Purchase event includes the Stripe checkout email, paid amount, currency,
and a hashed Checkout Session ID as its conversion ID. A browser session sends
that event once per purchase. Both event IDs are fixed in the application.
The purchase email comes from Stripe's `customer_details.email`, with
`customer_email` as a fallback. Use X Pixel Helper and Events Manager to verify
the live events.

The Course Payment Link `plink_1ULCVcLq4cPFl2NmpDfdZMqk` redirects to
`https://tomzaragoza.com/x/success?session_id={CHECKOUT_SESSION_ID}`.
Stripe replaces the placeholder with the completed Checkout Session ID.
The server retrieves that session and requires a paid course purchase before
it passes the checkout email to `tw-o6ml8-rfgj9`. The signed webhook records
course access even if the buyer does not return. Public Payment Link reference
IDs do not identify authenticated accounts. Purchases use the checkout email.
The success page is excluded from PostHog events and search indexing.
The presale lasts through October 16 in Eastern Time. The fixed Payment Link
price must be changed or the link deactivated in Stripe when the presale ends.

To verify a deployment, open the site and navigate to another course page.
Check for `$pageview` events in the PostHog activity feed. The two events should
have the same anonymous visitor ID. Use a separate test project for local work
if development events should be excluded from production reports.

## Google sign-in

Google sign-in uses Better Auth and the existing `MONGODB_URL` in `.env`.
Use `.env.example` as the configuration reference. Do not replace an existing `.env` file.

Set these values in `.env` locally and in the deployment environment for production:

- `MONGODB_URL`: the MongoDB connection string.
- `MONGODB_DB`: the database name. Defaults to `tomzaragoza`.
- `BETTER_AUTH_URL`: `http://localhost:3000` locally or `https://tomzaragoza.com` in production.
- `BETTER_AUTH_SECRET`: a random secret of at least 32 characters. Generate it with `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID`: the Google OAuth web client ID.
- `GOOGLE_CLIENT_SECRET`: the Google OAuth web client secret.

In the Google OAuth web client, add these **Authorized redirect URIs**:

```text
http://localhost:3000/api/auth/callback/google
https://www.tomzaragoza.com/api/auth/callback/google
https://tomzaragoza.com/api/auth/callback/google
```

The redirect URI must match the origin in `BETTER_AUTH_URL`. Restart the development server after changing `.env`.
For a Google app in testing mode, add the Google accounts that will test sign-in to its test users.

Signed-out visitors see the course landing page at `/x-ads`, with a Google
sign-in button. `/login` also opens the sign-in page. Sign-in returns to
`/x-ads` by default and shows the workspace dashboard. Its sidebar includes
Messages, an expandable course list, Ads Library, and course purchase links.
The library currently shows an empty state. Only the two preview
accounts can read lessons during the presale.
Google sign-in does not grant admin or MCP access.

Better Auth stores users, linked Google accounts, sessions, and verification records in the
`auth_users`, `auth_accounts`, `auth_sessions`, and `auth_verifications` collections.
MongoDB creates the collections when records are first written. No SQL migration is required.
Missing configuration returns a generic 503 response from `/api/auth/*` without exposing secrets.

Setup references: [Google provider](https://better-auth.com/docs/authentication/google),
[MongoDB adapter](https://better-auth.com/docs/adapters/mongo).

Run `npm run test:auth` to check missing configuration, anonymous sessions, unsafe return URLs,
cross-origin sign-out, invalid callbacks, and the complimentary-access rule. These tests use fake credentials and do not connect to MongoDB.
To check the complete flow, configure Google credentials, sign in from a course page, reload it,
and sign out. The name should persist after reload and disappear after sign-out.

## Admin and MCP authentication

Public tools are visible without authentication. Tools with `"visibility": "authenticated"` are visible when the request includes one of:

```text
Authorization: Bearer <TOMZARAGOZA_MCP_TOKEN>
x-api-key: <TOMZARAGOZA_MCP_TOKEN>
```

The endpoint builder API uses `TOMZARAGOZA_ADMIN_TOKEN`. Admin pages also require
the authorized Google account.

Local development defaults:

```text
TOMZARAGOZA_MCP_TOKEN=dev-mcp-token
TOMZARAGOZA_ADMIN_TOKEN=dev-admin-token
```

In production, set both env vars explicitly.

## Course editor

Sign in with the authorized Google account, then open `/admin/course`. This page
creates course pages and lists the current course structure. Open a lesson from
the list to edit its title, goal, sections, paragraphs, and video in place.

The course editor and its API allow only `tomdzaragoza@gmail.com`. Other signed-in
accounts cannot open the admin pages or write course content.

Video sources can be YouTube, Vimeo, Loom, or a direct HTTPS MP4 or WebM file.
An optional HTTPS WebVTT caption file can be attached to a direct video. The
editor stores course pages in the MongoDB `x_ads_course_pages` collection.

Each lesson uses one route: `/x-ads/<slug>`. All lesson content stays in sections
on that route. The application seeds the current course pages on first use and
does not overwrite later editor changes.

## Endpoint Builder

Open `/admin`, enter the admin token, and edit the text-backed MCP tools. The builder writes to `content/endpoints.json`.
