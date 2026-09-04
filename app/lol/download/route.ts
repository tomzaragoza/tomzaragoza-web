import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function passwordMatches(password: unknown) {
  if (typeof password !== "string") {
    return false;
  }

  const expectedPassword = process.env.LOL_DOWNLOAD_PASSWORD ?? "lol2";
  const provided = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? body.password
      : undefined;

  if (!passwordMatches(password)) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const file = await readFile(join(process.cwd(), "downloads", "act.zip"));

  return new Response(new Uint8Array(file), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="act.zip"',
      "Content-Length": String(file.byteLength),
      "Content-Type": "application/zip",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}
