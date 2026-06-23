import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const endpointSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers, and underscores."),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  visibility: z.enum(["public", "authenticated"]),
  text: z.string().min(1).max(4000)
});

const endpointsFileSchema = z.object({
  endpoints: z.array(endpointSchema).min(1).max(50)
});

export type EndpointDefinition = z.infer<typeof endpointSchema>;
export type EndpointsFile = z.infer<typeof endpointsFileSchema>;

const defaultEndpoints: EndpointsFile = {
  endpoints: [
    {
      name: "get_summary",
      title: "Get Summary",
      description: "Returns a short public summary for Tom Zaragoza.",
      visibility: "public",
      text: "building things on the internet"
    }
  ]
};

function endpointFilePath() {
  return path.join(process.cwd(), "content", "endpoints.json");
}

function assertUniqueNames(endpoints: EndpointDefinition[]) {
  const seen = new Set<string>();

  for (const endpoint of endpoints) {
    if (seen.has(endpoint.name)) {
      throw new Error(`Duplicate endpoint name: ${endpoint.name}`);
    }
    seen.add(endpoint.name);
  }
}

export function validateEndpointsFile(value: unknown): EndpointsFile {
  const parsed = endpointsFileSchema.parse(value);
  assertUniqueNames(parsed.endpoints);
  return parsed;
}

export async function readEndpointsFile(): Promise<EndpointsFile> {
  try {
    const raw = await readFile(endpointFilePath(), "utf8");
    return validateEndpointsFile(JSON.parse(raw));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return defaultEndpoints;
    }

    throw error;
  }
}

export async function writeEndpointsFile(value: unknown) {
  const parsed = validateEndpointsFile(value);
  const file = endpointFilePath();
  const tempFile = `${file}.tmp`;

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(tempFile, `${JSON.stringify(parsed, null, 2)}\n`);
  await rename(tempFile, file);

  return parsed;
}

export function endpointsForAuth(file: EndpointsFile, authenticated: boolean) {
  if (authenticated) {
    return file.endpoints;
  }

  return file.endpoints.filter((endpoint) => endpoint.visibility === "public");
}
