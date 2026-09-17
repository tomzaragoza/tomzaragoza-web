import Link from "next/link";
import { notFound } from "next/navigation";
import { authHint } from "@/lib/auth";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { AdminAccessGate } from "./admin-access-gate";
import { EndpointBuilder } from "./endpoint-builder";

export default async function AdminPage() {
  const access = await getCourseAdminAccess();

  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();

  return (
    <main className="admin-shell">
      <section className="admin-panel" aria-labelledby="builder-title">
        <div className="admin-header">
          <p>tomzaragoza-web</p>
          <h1 id="builder-title">Endpoint builder</h1>
          <Link href="/admin/course">Open course editor →</Link>
        </div>
        <EndpointBuilder authHint={authHint()} />
      </section>
    </main>
  );
}
