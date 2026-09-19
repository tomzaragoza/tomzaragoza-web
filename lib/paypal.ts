import "server-only";

type PayPalEnvironment = "live" | "sandbox";

export type PayPalOrder = {
  id?: string;
  intent?: string;
  status?: string;
  create_time?: string;
  links?: Array<{ rel?: string; href?: string }>;
  payer?: { email_address?: string; payer_id?: string };
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: { captures?: Array<{
      id?: string;
      status?: string;
      final_capture?: boolean;
      amount?: { currency_code?: string; value?: string };
      create_time?: string;
    }> };
  }>;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function environment(): PayPalEnvironment {
  const value = process.env.PAYPAL_ENVIRONMENT?.trim() || "live";
  if (value === "live" || value === "sandbox") return value;
  throw new Error("PAYPAL_ENVIRONMENT must be live or sandbox.");
}

export function paypalIsConfigured() {
  return Boolean(process.env.PAYPAL_API_KEY?.trim() && process.env.PAYPAL_SECRET_KEY?.trim());
}

function apiBase() {
  return environment() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const id = process.env.PAYPAL_API_KEY?.trim();
  const secret = process.env.PAYPAL_SECRET_KEY?.trim();
  if (!id || !secret) throw new Error("PayPal is not configured.");
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000)
  });
  const result = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !result.access_token) throw new Error("PayPal authentication failed.");
  cachedToken = {
    value: result.access_token,
    expiresAt: Date.now() + Math.max(result.expires_in || 300, 60) * 1000
  };
  return result.access_token;
}

export async function paypalRequest<T>(path: string, init: RequestInit & { requestId?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${await accessToken()}`);
  headers.set("Prefer", "return=representation");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (init.requestId) headers.set("PayPal-Request-Id", init.requestId);
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal || AbortSignal.timeout(20_000)
  });
  const result = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(`PayPal request failed (${response.status}).`);
  return result;
}

export function isPayPalId(value: string): boolean {
  return /^[A-Z0-9]{10,32}$/.test(value);
}
