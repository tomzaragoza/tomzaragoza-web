import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isMcpAuthorized } from "@/lib/auth";
import { endpointsForAuth, readEndpointsFile } from "@/lib/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createServer(authenticated: boolean) {
  const server = new McpServer({
    name: "tomzaragoza",
    version: "0.1.0"
  });
  const endpointFile = await readEndpointsFile();
  const endpoints = endpointsForAuth(endpointFile, authenticated);

  for (const endpoint of endpoints) {
    server.registerTool(endpoint.name, {
      title: endpoint.title,
      description: endpoint.description
    }, async () => ({
      content: [
        {
          type: "text",
          text: endpoint.text
        }
      ]
    }));
  }

  return server;
}

async function handleMcpRequest(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  const server = await createServer(isMcpAuthorized(request));

  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
    await transport.close();
  }
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
