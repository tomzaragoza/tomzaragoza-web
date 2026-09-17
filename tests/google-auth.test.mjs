import assert from "node:assert/strict";
import { test } from "node:test";
import { randomBytes } from "node:crypto";
import { getGoogleAuth } from "../lib/google-auth.ts";
import { isCourseAdminEmail } from "../lib/course-admin-policy.ts";
import { hasComplimentaryCourseAccess } from "../lib/course-access-policy.ts";

test("complimentary course access uses the configured Google email", () => {
  assert.equal(hasComplimentaryCourseAccess("tomdzaragoza@gmail.com"), true);
  assert.equal(hasComplimentaryCourseAccess(" TOMDZARAGOZA@GMAIL.COM "), true);
  assert.equal(hasComplimentaryCourseAccess("someone@example.com"), false);
  assert.equal(hasComplimentaryCourseAccess(null), false);
});

test("course administration is limited to Tom's Google email", () => {
  assert.equal(isCourseAdminEmail("tomdzaragoza@gmail.com"), true);
  assert.equal(isCourseAdminEmail(" TOMDZARAGOZA@GMAIL.COM "), true);
  assert.equal(isCourseAdminEmail("someone@example.com"), false);
  assert.equal(isCourseAdminEmail(null), false);
});

test("Google sign-in rejects unsafe requests without connecting to MongoDB", async (t) => {
  const names = [
    "MONGODB_URL", "MONGODB_DB", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"
  ];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  t.after(async () => {
    await globalThis.authMongoClient?.close();
    delete globalThis.authMongoClient;
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  Object.assign(process.env, {
    MONGODB_URL: "mongodb://127.0.0.1:1/auth_test",
    MONGODB_DB: "auth_test",
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
    GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-only-client-secret"
  });

  await t.test("missing credentials do not create an auth instance", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal(getGoogleAuth(), null);
    assert.equal(globalThis.authMongoClient, undefined);
    process.env.GOOGLE_CLIENT_SECRET = clientSecret;
  });

  const auth = getGoogleAuth();
  assert.ok(auth);

  await t.test("anonymous requests have no session", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/get-session"));
    assert.equal(response.status, 200);
    assert.equal(await response.json(), null);
  });

  await t.test("external return URLs are rejected", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/sign-in/social", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ provider: "google", callbackURL: "https://untrusted.example" })
    }));
    assert.equal(response.status, 403);
  });

  await t.test("cross-origin sign-out is rejected", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://untrusted.example",
        Cookie: "better-auth.session_token=forged"
      },
      body: "{}"
    }));
    assert.equal(response.status, 403);
  });

  await t.test("the production www origin is trusted", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tomzaragoza.com"
      },
      body: "{}"
    }));
    assert.notEqual(response.status, 403);
  });

  await t.test("a callback without OAuth state cannot create a session", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/callback/google?code=forged"));
    assert.ok(response.status >= 300 && response.status < 400);
    assert.match(response.headers.get("location"), /error=/);
    assert.ok(!response.headers.get("set-cookie")?.includes("session_token="));
  });
});
