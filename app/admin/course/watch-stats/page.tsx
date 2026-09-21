import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getCourseNavigation, getCoursePageBySlug } from "@/lib/course-content";
import { coursePageVideos, getCourseWatchStats, watchSourceKey } from "@/lib/course-watch";
import { watchSummary } from "@/lib/course-watch-shared";
import { AdminAccessGate } from "../../admin-access-gate";
import styles from "../course-editor.module.css";
import statsStyles from "./watch-stats.module.css";

export const dynamic = "force-dynamic";

export default async function WatchStats({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const access = await getCourseAdminAccess();
  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();
  const navigation = await getCourseNavigation();
  const { page: requestedPage } = await searchParams;
  const slug = navigation.find(page => page.slug === requestedPage)?.slug ?? navigation.find(page => page.slug !== "introduction")?.slug;
  const page = slug ? await getCoursePageBySlug(slug) : undefined;
  const videos = page ? coursePageVideos(page) : [];
  const records = page ? await getCourseWatchStats(page.slug) : [];
  const current = records.filter(record => videos.some(video => video.id === record.videoId && watchSourceKey(video.url) === record.sourceKey));
  const learners = new Map(current.map(record => [record.userId, record]));

  return <main className={styles.shell}>
    <div className={styles.header}>
      <div><h1>Video watch stats</h1><p>Watch progress for each learner, page, and video. Repeated viewing counts once.</p></div>
      <Link href="/admin/course">Course CMS</Link>
    </div>
    <form className={statsStyles.filter}>
      <label htmlFor="watch-page">Course page</label>
      <select name="page" id="watch-page" defaultValue={slug}>{navigation.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select>
      <button type="submit">View stats</button>
    </form>
    {page && <section>
      <h2>{page.title}</h2>
      <p>{videos.length} {videos.length === 1 ? "video" : "videos"} · {learners.size} {learners.size === 1 ? "viewer" : "viewers"}</p>
      {videos.length === 0 ? <p>This page has no published videos.</p> : videos.map(video => {
        const viewers = current.filter(record => record.videoId === video.id);
        const average = viewers.length ? Math.floor(viewers.reduce((sum, record) => sum + watchSummary(record.seconds, record.duration).percentage, 0) / viewers.length) : 0;
        const unsupported = video.url.includes("loom.com/");
        return <section key={video.id} className={statsStyles.video}>
          <h3>{video.title}</h3>
          <p>{unsupported ? "Loom does not expose watch progress here. Upload an MP4 or WebM to track this video." : `${viewers.length} viewers · ${average}% average watched`}</p>
          {viewers.length > 0 && <div className={statsStyles.tableScroll}><table>
            <caption className={statsStyles.srOnly}>{video.title} viewer progress</caption>
            <thead><tr><th scope="col">Viewer</th><th scope="col">Watched</th><th scope="col">Video duration</th><th scope="col">Last watched</th></tr></thead>
            <tbody>{viewers.map(record => <tr key={record.userId}>
              <th scope="row">{record.userName}<span>{record.userEmail}</span></th>
              <td>{watchSummary(record.seconds, record.duration).percentage}%</td>
              <td>{Math.ceil(record.duration / 60)} min</td>
              <td><time dateTime={record.updatedAt.toISOString()}>{record.updatedAt.toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })} ET</time></td>
            </tr>)}</tbody>
          </table></div>}
          {!unsupported && viewers.length === 0 && <p>No saved watch progress yet.</p>}
        </section>;
      })}
      {learners.size > 0 && <section className={statsStyles.video}>
        <h3>Page progress</h3>
        <p>Average video percentage per viewer. Unwatched videos count as 0%. Loom embeds are excluded.</p>
        <ul>{[...learners.values()].map(learner => {
          const tracked = videos.filter(video => !video.url.includes("loom.com/"));
          const sum = current.filter(record => record.userId === learner.userId && tracked.some(video => video.id === record.videoId))
            .reduce((total, record) => total + watchSummary(record.seconds, record.duration).percentage, 0);
          return <li key={learner.userId}>{learner.userName} ({learner.userEmail}): {tracked.length ? Math.floor(sum / tracked.length) : 0}%</li>;
        })}</ul>
      </section>}
    </section>}
  </main>;
}
