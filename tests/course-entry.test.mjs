import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import ts from "typescript";
import "../scripts/course-node-loader.mjs";

const state = { access: "signed-out", navigation: [
  { slug: "introduction", path: "/x-ads" },
  { slug: "principles", path: "/x-ads/principles" }
] };
globalThis.courseEntryTest = state;
const mocks = {
  "next/navigation": "export function redirect(url){throw Object.assign(new Error('redirect'),{destination:url});}",
  "@/lib/course-access": "export const getCourseAccess=async()=>globalThis.courseEntryTest.access;",
  "@/lib/course-content": "export const getCourseNavigation=async()=>globalThis.courseEntryTest.navigation;",
  "./course-landing": "export function CourseLanding(){return null;}"
};
registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith("/app/x-ads/page.tsx") && mocks[specifier]) {
      return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(mocks[specifier])}` };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith("/app/x-ads/page.tsx")) {
      return { shortCircuit: true, format: "module", source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }
      }).outputText };
    }
    return next(url, context);
  }
});
const { default: CourseEntry } = await import("../app/x-ads/page.tsx");
const enter = purchase => CourseEntry({ searchParams: Promise.resolve({ purchase }) });

test("signed-out visitors see the landing page", async () => {
  const page = await enter();
  assert.equal(page.type.name, "CourseLanding");
});

test("signed-in customers open the first section and retain payment status", async () => {
  for (const access of ["owner", "course", "pro", "upgrade-required"]) {
    state.access = access;
    await assert.rejects(enter(), error => error.destination === "/x-ads/principles");
  }
  state.access = "pro";
  await assert.rejects(enter("pro"), error => error.destination === "/x-ads/principles?purchase=pro");
  await assert.rejects(enter("error"), error => error.destination === "/x-ads/principles?purchase=error");
  await assert.rejects(enter("invalid"), error => error.destination === "/x-ads/principles");
});

test("an empty course does not redirect to a missing section", async () => {
  state.navigation = [{ slug: "introduction", path: "/x-ads" }];
  const page = await enter();
  assert.equal(page.type.name, "CourseLanding");
});
