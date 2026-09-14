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
https://tomzaragoza.com/api/auth/callback/google
```

The redirect URI must match the origin in `BETTER_AUTH_URL`. Restart the development server after changing `.env`.
For a Google app in testing mode, add the Google accounts that will test sign-in to its test users.

Sign in from the X Ads sidebar or `/sign-in`. After sign-in, the sidebar shows the user's name and a sign-out button.
Sign-in returns to the current course page. Sign-in from `/sign-in` returns to `/x-ads`.
Course pages remain public. Google sign-in does not grant admin or MCP access.

Better Auth stores users, linked Google accounts, sessions, and verification records in the
`auth_users`, `auth_accounts`, `auth_sessions`, and `auth_verifications` collections.
MongoDB creates the collections when records are first written. No SQL migration is required.
Missing configuration returns a generic 503 response from `/api/auth/*` without exposing secrets.

Setup references: [Google provider](https://better-auth.com/docs/authentication/google),
[MongoDB adapter](https://better-auth.com/docs/adapters/mongo).

Run `npm run test:auth` to check missing configuration, anonymous sessions, unsafe return URLs,
cross-origin sign-out, and invalid callbacks. These tests use fake credentials and do not connect to MongoDB.
To check the complete flow, configure Google credentials, sign in from a course page, reload it,
and sign out. The name should persist after reload and disappear after sign-out.

## Admin and MCP authentication

Public tools are visible without authentication. Tools with `"visibility": "authenticated"` are visible when the request includes one of:

```text
Authorization: Bearer <TOMZARAGOZA_MCP_TOKEN>
x-api-key: <TOMZARAGOZA_MCP_TOKEN>
```

Admin CMS access uses `TOMZARAGOZA_ADMIN_TOKEN`.

Local development defaults:

```text
TOMZARAGOZA_MCP_TOKEN=dev-mcp-token
TOMZARAGOZA_ADMIN_TOKEN=dev-admin-token
```

In production, set both env vars explicitly.

## Endpoint Builder

Open `/admin`, enter the admin token, and edit the text-backed MCP tools. The builder writes to `content/endpoints.json`.
