import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import ts from "typescript";
import "../scripts/course-node-loader.mjs";

const mediaId = "00000000-0000-0000-0000-000000000000";
const page = {
  slug: "lesson", path: "/x-ads/lesson", title: "Paid lesson", description: "Course outline",
  outcome: "Private lesson outcome",
  content: [{ id: "secret", paragraphs: ["Paid written lesson"] }],
  blocks: [{ id: "secret", type: "paragraph", props: {}, content: [{ type: "text", text: "Paid written lesson", styles: {} }], children: [] }],
  mainVideo: { url: `/api/course/media/${mediaId}` }
};
const state = { user: null, tier: null, page, mediaReads: 0 };
globalThis.coursePaywallTest = state;
const authMock = "export const getGoogleAuth=()=>({api:{getSession:async()=>globalThis.coursePaywallTest.user?{user:globalThis.coursePaywallTest.user}:null}});";
const contentMock = "export const getCoursePageBySlug=async slug=>slug===globalThis.coursePaywallTest.page.slug?globalThis.coursePaywallTest.page:null;export const getCourseNavigation=async()=>[{slug:'lesson',path:'/x-ads/lesson',title:'Paid lesson',description:'Course outline'}];export const getAdminCoursePages=async()=>[globalThis.coursePaywallTest.page];";
registerHooks({
  resolve(specifier, context, next) {
    const parent = decodeURIComponent(context.parentURL ?? "");
    let mock;
    if (specifier === "@/lib/google-auth" && /\/lib\/course-(access|admin)\.ts$/.test(parent)) mock = authMock;
    if (specifier === "next/headers" && /\/lib\/course-(access|admin)\.ts$/.test(parent)) mock = "export const headers=async()=>new Headers();";
    if (specifier === "@/lib/course-entitlements" && parent.endsWith("/lib/course-access.ts")) mock = "export const getPurchasedCourseTier=async()=>globalThis.coursePaywallTest.tier;";
    if (specifier === "@/lib/course-content" && (parent.endsWith("/app/x-ads/[slug]/page.tsx") || parent.endsWith("/app/api/course/media/[id]/route.ts"))) mock = contentMock;
    if (specifier === "../course-page" && parent.endsWith("/app/x-ads/[slug]/page.tsx")) mock = "export function CoursePage(){return null;}";
    if (specifier === "next/navigation" && parent.endsWith("/app/x-ads/[slug]/page.tsx")) mock = "export function notFound(){throw new Error('not-found');}";
    if (specifier === "@/lib/course-media" && parent.endsWith("/app/api/course/media/[id]/route.ts")) {
      mock = `export const courseMediaCollection=()=>({findOne:async()=>{globalThis.coursePaywallTest.mediaReads++;return {id:'${mediaId}',pageSlug:'lesson',status:'ready'};}});export const courseMediaReadUrl=async()=> 'https://media.example.invalid/signed-video';`;
    }
    if (mock) return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(mock)}` };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (decodeURIComponent(url).endsWith("/app/x-ads/[slug]/page.tsx")) return {
      shortCircuit: true, format: "module", source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }
      }).outputText
    };
    return next(url, context);
  }
});
const { getCourseAccess } = await import("../lib/course-access.ts");
const { default: LessonPage } = await import("../app/x-ads/[slug]/page.tsx");
const { GET: getImage } = await import("../app/images/[name]/route.ts");
const { GET: getMedia } = await import("../app/api/course/media/[id]/route.ts");
const viewLesson = () => LessonPage({ params: Promise.resolve({ slug: "lesson" }), searchParams: Promise.resolve({}) });
const image = name => getImage(new Request(`https://example.com/images/${name}`), { params: Promise.resolve({ name }) });
const media = () => getMedia(new Request(`https://example.com/api/course/media/${mediaId}`), { params: Promise.resolve({ id: mediaId }) });
const signIn = email => { state.user = { id: "viewer", name: "Viewer", email, emailVerified: true }; };

test("signed-out and unpaid users never receive lesson bodies, outcomes, videos, or image bytes", async () => {
  for (const email of [null, "buyer@example.com", "todazar@gmail.com"]) {
    state.user = null;
    state.tier = null;
    if (email) signIn(email);
    assert.equal(await getCourseAccess(), email ? "upgrade-required" : "signed-out");
    const result = await viewLesson();
    assert.deepEqual(result.props.page.content, []);
    assert.deepEqual(result.props.page.blocks, []);
    assert.equal(result.props.page.mainVideo, null);
    assert.equal(result.props.page.outcome, undefined);
    assert.ok(!JSON.stringify(result.props).includes("Paid written lesson"));
    const response = await image("tracking-methods.png");
    assert.equal(response.status, 403);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal((await media()).status, 403);
  }
  assert.equal(state.mediaReads, 0);
});

test("both paid plans can read lessons and private media", async () => {
  signIn("buyer@example.com");
  for (const tier of ["course", "pro"]) {
    state.tier = tier;
    assert.equal(await getCourseAccess(), tier);
    const result = await viewLesson();
    assert.equal(result.props.page.content[0].paragraphs[0], "Paid written lesson");
    assert.equal(result.props.page.mainVideo.url, page.mainVideo.url);
    const response = await image("tracking-methods.png");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("vary"), "Cookie");
    assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer()).slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    const mediaResponse = await media();
    assert.equal(mediaResponse.status, 307);
    assert.equal(mediaResponse.headers.get("cache-control"), "private, no-store");
  }
});

test("only the course administrator retains editing access without a purchase", async () => {
  signIn("tomdzaragoza@gmail.com");
  state.tier = null;
  assert.equal(await getCourseAccess(), "owner");
  const result = await viewLesson();
  assert.equal(result.props.canEdit, true);
  assert.equal(result.props.page.content[0].paragraphs[0], "Paid written lesson");
  assert.equal((await image("launch-1.png")).status, 200);
});

test("private image routes reject unknown files and course images are absent from public", async () => {
  assert.equal((await image("../package.json")).status, 404);
  assert.equal((await image("not-a-lesson.png")).status, 404);
  const names = ["tracking-methods.png", "tracking-base-code.png", "tracking-create-event.gif", "tracking-event-status.png", "launch-1.png", "launch-locations.png", "launch-advanced-targeting.gif", "launch-conversion.png"];
  for (const name of names) {
    assert.equal(existsSync(`public/images/${name}`), false);
    assert.equal(existsSync(`private/course-images/${name}`), true);
  }
});
