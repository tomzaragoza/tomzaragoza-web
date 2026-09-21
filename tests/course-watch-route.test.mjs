import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import "../scripts/course-node-loader.mjs";

const state = { user: null, access: "owner", writes: [] };
globalThis.watchRouteTest = state;
const page = { slug: "lesson", path: "/x-ads/lesson", title: "Lesson", content: [], mainVideo: { url: "https://example.com/video.mp4" } };
state.page = page;
const mocks = {
  "@/lib/google-auth": "export const getGoogleAuth=()=>({api:{getSession:async()=>globalThis.watchRouteTest.user?{user:globalThis.watchRouteTest.user}:null}});",
  "@/lib/course-access": "export const getCourseAccess=async()=>globalThis.watchRouteTest.access;",
  "@/lib/course-content": "export const getCoursePageBySlug=async slug=>slug===globalThis.watchRouteTest.page.slug?globalThis.watchRouteTest.page:null;",
  "@/lib/course-watch": "export const resolveWatchTarget=(page,input)=>input.videoId==='main-video'&&input.source===page.mainVideo.url;export const getWatchProgress=async userId=>({userId});export const saveWatchProgress=async(user,page,input)=>{globalThis.watchRouteTest.writes.push({user,page,input});return {percentage:10};};"
};
registerHooks({ resolve(specifier, context, next) {
  if (mocks[specifier] && context.parentURL?.endsWith("/app/api/course/watch/route.ts")) return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(mocks[specifier])}` };
  return next(specifier, context);
} });
const { GET, POST } = await import("../app/api/course/watch/route.ts");
const valid = { pageSlug: "lesson", videoId: "main-video", source: page.mainVideo.url, duration: 100, position: 10, seconds: [1, 2] };
const post = (body, origin = "https://example.com") => new Request("https://example.com/api/course/watch", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
const get = input => new Request(`https://example.com/api/course/watch?${new URLSearchParams(input)}`);

test("watch API checks authentication, entitlement, origin, and the published video", async () => {
  assert.equal((await GET(get(valid))).status, 403);
  assert.equal((await POST(post(valid))).status, 403);
  state.user = { id: "viewer", name: "Viewer", email: "viewer@example.invalid" };
  state.access = "upgrade-required";
  assert.equal((await POST(post(valid))).status, 403);
  state.access = "owner";
  assert.equal((await POST(post(valid, "https://untrusted.example"))).status, 403);
  assert.equal((await POST(post({ ...valid, seconds: [100] }))).status, 400);
  assert.equal((await POST(post({ ...valid, source: "https://example.com/replaced.mp4" }))).status, 404);
  assert.equal((await GET(get({ ...valid, videoId: "unknown" }))).status, 404);
  assert.equal((await POST(post({ ...valid, userId: "someone-else" }))).status, 200);
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].user.id, "viewer");
  const response = await GET(get(valid));
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).progress.userId, "viewer");
});
