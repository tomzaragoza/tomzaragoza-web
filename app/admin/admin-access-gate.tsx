import { AuthControls } from "@/app/components/auth-controls";

export function AdminAccessGate() {
  return (
    <main className="admin-shell">
      <section className="admin-panel" aria-labelledby="admin-access-title">
        <div className="admin-header">
          <p>Private workspace</p>
          <h1 id="admin-access-title">Admin access</h1>
        </div>
        <p className="admin-note">Sign in with the authorized Google account to continue.</p>
        <AuthControls />
      </section>
    </main>
  );
}
