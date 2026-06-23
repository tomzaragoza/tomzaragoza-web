import { timingSafeEqual } from "node:crypto";

const DEV_MCP_TOKEN = "dev-mcp-token";
const DEV_ADMIN_TOKEN = "dev-admin-token";

function configuredToken(name: "TOMZARAGOZA_MCP_TOKEN" | "TOMZARAGOZA_ADMIN_TOKEN") {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return name === "TOMZARAGOZA_MCP_TOKEN" ? DEV_MCP_TOKEN : DEV_ADMIN_TOKEN;
  }

  return undefined;
}

function requestToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-api-key")?.trim();
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isMcpAuthorized(request: Request) {
  const token = requestToken(request);
  const mcpToken = configuredToken("TOMZARAGOZA_MCP_TOKEN");
  const adminToken = configuredToken("TOMZARAGOZA_ADMIN_TOKEN");

  if (!token) {
    return false;
  }

  return Boolean(
    (mcpToken && secureEqual(token, mcpToken)) ||
      (adminToken && secureEqual(token, adminToken))
  );
}

export function isAdminAuthorized(request: Request) {
  const token = requestToken(request);
  const adminToken = configuredToken("TOMZARAGOZA_ADMIN_TOKEN");

  return Boolean(token && adminToken && secureEqual(token, adminToken));
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

export function authHint() {
  if (process.env.NODE_ENV === "production") {
    return "Set TOMZARAGOZA_ADMIN_TOKEN and TOMZARAGOZA_MCP_TOKEN in the deployment environment.";
  }

  return "Local dev tokens: TOMZARAGOZA_ADMIN_TOKEN=dev-admin-token, TOMZARAGOZA_MCP_TOKEN=dev-mcp-token";
}
