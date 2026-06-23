import { authHint } from "@/lib/auth";
import { EndpointBuilder } from "./endpoint-builder";

export default function AdminPage() {
  return (
    <main className="admin-shell">
      <section className="admin-panel" aria-labelledby="builder-title">
        <div className="admin-header">
          <p>tomzaragoza-web</p>
          <h1 id="builder-title">Endpoint builder</h1>
        </div>
        <EndpointBuilder authHint={authHint()} />
      </section>
    </main>
  );
}
