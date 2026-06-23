"use client";

import { useMemo, useState } from "react";

type EndpointVisibility = "public" | "authenticated";

type EndpointDefinition = {
  name: string;
  title: string;
  description: string;
  visibility: EndpointVisibility;
  text: string;
};

type EndpointsPayload = {
  endpoints: EndpointDefinition[];
};

const blankEndpoint: EndpointDefinition = {
  name: "get_new_endpoint",
  title: "Get New Endpoint",
  description: "Returns CMS-managed text.",
  visibility: "authenticated",
  text: "Add text here."
};

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

function nextEndpointName(endpoints: EndpointDefinition[]) {
  const names = new Set(endpoints.map((endpoint) => endpoint.name));
  let index = endpoints.length + 1;
  let name = `get_text_${index}`;

  while (names.has(name)) {
    index += 1;
    name = `get_text_${index}`;
  }

  return name;
}

export function EndpointBuilder({ authHint }: { authHint: string }) {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("tomzaragoza-admin-token") ?? "";
  });
  const [endpoints, setEndpoints] = useState<EndpointDefinition[]>([]);
  const [status, setStatus] = useState("Enter an admin token to load endpoints.");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const publicCount = useMemo(
    () => endpoints.filter((endpoint) => endpoint.visibility === "public").length,
    [endpoints]
  );

  const privateCount = endpoints.length - publicCount;

  async function loadEndpoints(nextToken = token) {
    setIsBusy(true);
    setError("");
    setStatus("Loading endpoints.");

    try {
      const response = await fetch("/api/endpoints", {
        headers: authHeaders(nextToken)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to load endpoints.");
      }

      setEndpoints(body.endpoints);
      window.localStorage.setItem("tomzaragoza-admin-token", nextToken);
      setStatus(`Loaded ${body.endpoints.length} endpoints.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load endpoints.");
      setStatus("Load failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveEndpoints() {
    setIsBusy(true);
    setError("");
    setStatus("Saving endpoints.");

    try {
      const payload: EndpointsPayload = { endpoints };
      const response = await fetch("/api/endpoints", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save endpoints.");
      }

      setEndpoints(body.endpoints);
      window.localStorage.setItem("tomzaragoza-admin-token", token);
      setStatus(`Saved ${body.endpoints.length} endpoints.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save endpoints.");
      setStatus("Save failed.");
    } finally {
      setIsBusy(false);
    }
  }

  function updateEndpoint(index: number, patch: Partial<EndpointDefinition>) {
    setEndpoints((current) =>
      current.map((endpoint, currentIndex) =>
        currentIndex === index ? { ...endpoint, ...patch } : endpoint
      )
    );
  }

  function addEndpoint() {
    setEndpoints((current) => [
      ...current,
      {
        ...blankEndpoint,
        name: nextEndpointName(current),
        title: "Get Text"
      }
    ]);
  }

  function removeEndpoint(index: number) {
    setEndpoints((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="builder">
      <form
        className="token-row"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextToken = String(formData.get("admin-token") ?? "");
          setToken(nextToken);
          void loadEndpoints(nextToken);
        }}
      >
        <label htmlFor="admin-token">Admin token</label>
        <input
          id="admin-token"
          name="admin-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={isBusy}>
          Load
        </button>
      </form>

      <p className="admin-note">{authHint}</p>

      <div className="builder-meta" aria-live="polite">
        <span>{status}</span>
        <span>
          {publicCount} public / {privateCount} authenticated
        </span>
      </div>

      {error ? <p className="builder-error">{error}</p> : null}

      <div className="endpoint-list">
        {endpoints.map((endpoint, index) => (
          <article className="endpoint-card" key={`${endpoint.name}-${index}`}>
            <div className="endpoint-card-header">
              <label>
                name
                <input
                  value={endpoint.name}
                  onChange={(event) => updateEndpoint(index, { name: event.target.value })}
                />
              </label>
              <label>
                visibility
                <select
                  value={endpoint.visibility}
                  onChange={(event) =>
                    updateEndpoint(index, {
                      visibility: event.target.value as EndpointVisibility
                    })
                  }
                >
                  <option value="public">public</option>
                  <option value="authenticated">authenticated</option>
                </select>
              </label>
            </div>

            <label>
              title
              <input
                value={endpoint.title}
                onChange={(event) => updateEndpoint(index, { title: event.target.value })}
              />
            </label>

            <label>
              description
              <input
                value={endpoint.description}
                onChange={(event) => updateEndpoint(index, { description: event.target.value })}
              />
            </label>

            <label>
              text
              <textarea
                value={endpoint.text}
                onChange={(event) => updateEndpoint(index, { text: event.target.value })}
                rows={6}
              />
            </label>

            <button
              className="danger-button"
              type="button"
              onClick={() => removeEndpoint(index)}
              disabled={endpoints.length <= 1}
            >
              Remove
            </button>
          </article>
        ))}
      </div>

      <div className="builder-actions">
        <button type="button" onClick={addEndpoint}>
          Add endpoint
        </button>
        <button type="button" onClick={saveEndpoints} disabled={isBusy || !token || endpoints.length === 0}>
          Save endpoints
        </button>
      </div>
    </div>
  );
}
