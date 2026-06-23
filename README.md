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

## Auth

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
