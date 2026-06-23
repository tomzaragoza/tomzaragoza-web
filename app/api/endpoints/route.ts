import { isAdminAuthorized, unauthorizedResponse } from "@/lib/auth";
import { readEndpointsFile, writeEndpointsFile } from "@/lib/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  return Response.json(await readEndpointsFile());
}

export async function PUT(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    return Response.json(await writeEndpointsFile(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid endpoint payload";
    return Response.json({ error: message }, { status: 400 });
  }
}
