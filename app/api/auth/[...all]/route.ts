import { getGoogleAuth } from "@/lib/google-auth";

export const runtime = "nodejs";

async function handleAuth(request: Request) {
  const auth = getGoogleAuth();

  if (!auth) {
    return Response.json(
      { message: "Sign-in is temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return auth.handler(request);
}

export { handleAuth as GET, handleAuth as POST };
