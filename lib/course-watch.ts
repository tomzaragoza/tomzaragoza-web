import "server-only";

import { createHash } from "node:crypto";
import { MongoClient, MongoServerError } from "mongodb";
import { flattenCourseBlocks, legacyCourseBlocks } from "@/lib/course-blocks";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import { getCourseVideoSource } from "@/lib/course-video";
import { watchSummary, type WatchTarget, type WatchUpdate } from "@/lib/course-watch-shared";

type Viewer = { id: string; name: string; email: string };
type WatchDocument = {
  userId: string; userName: string; userEmail: string;
  pageSlug: string; pageTitle: string; videoId: string; videoTitle: string; sourceKey: string;
  seconds: number[]; duration: number; position: number; createdAt: Date; updatedAt: Date;
  positionObservedAt?: number;
};
const cache = globalThis as typeof globalThis & { courseWatchMongo?: MongoClient; courseWatchIndexes?: Promise<unknown> };

async function collection() {
  const uri = process.env.MONGODB_URL?.trim();
  if (!uri) throw new Error("Course database is not configured.");
  cache.courseWatchMongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  const records = cache.courseWatchMongo.db(process.env.MONGODB_DB || "tomzaragoza").collection<WatchDocument>("x_ads_course_watch");
  cache.courseWatchIndexes ??= Promise.all([
    records.createIndex({ userId: 1, pageSlug: 1, videoId: 1, sourceKey: 1 }, { unique: true }),
    records.createIndex({ pageSlug: 1, updatedAt: -1 })
  ]).catch(error => { cache.courseWatchIndexes = undefined; throw error; });
  await cache.courseWatchIndexes;
  return records;
}

export function coursePageVideos(page: CoursePageRecord) {
  const videos = flattenCourseBlocks(page.blocks ?? legacyCourseBlocks(page.content))
    .filter(block => block.type === "video" && block.props.url)
    .map(block => ({ id: block.id, url: block.props.url!, title: block.props.caption || block.props.name || "Lesson video" }));
  if (page.mainVideo) videos.unshift({ id: "main-video", url: page.mainVideo.url, title: page.mainVideo.title || "Main video" });
  return videos;
}

export function watchSourceKey(url: string) {
  const source = getCourseVideoSource(url);
  return source ? createHash("sha256").update(source.src).digest("hex") : null;
}

export function resolveWatchTarget(page: CoursePageRecord, target: WatchTarget) {
  const video = coursePageVideos(page).find(video => video.id === target.videoId);
  const sourceKey = watchSourceKey(target.source);
  return page.slug === target.pageSlug && video && sourceKey && sourceKey === watchSourceKey(video.url)
    ? { video, sourceKey } : null;
}

export async function getWatchProgress(userId: string, target: WatchTarget) {
  const record = await (await collection()).findOne({ userId, pageSlug: target.pageSlug, videoId: target.videoId, sourceKey: watchSourceKey(target.source)! });
  return record ? { seconds: record.seconds, duration: record.duration, position: record.position, percentage: watchSummary(record.seconds, record.duration).percentage } : null;
}

export async function saveWatchProgress(user: Viewer, page: CoursePageRecord, input: WatchUpdate) {
  const target = resolveWatchTarget(page, input);
  if (!target) throw new Error("This video is no longer on this page.");
  const records = await collection();
  const filter = { userId: user.id, pageSlug: page.slug, videoId: input.videoId, sourceKey: target.sourceKey };
  const now = new Date();
  const observedAt = input.observedAt ?? now.getTime();
  const isNewer = { $gte: [observedAt, { $ifNull: ["$positionObservedAt", 0] }] };
  // Merge watch coverage from every request, but only move the resume point for
  // newer playback. A delayed request must not undo a later pause or rewind.
  const update = [{ $set: {
    userName: { $literal: user.name }, userEmail: { $literal: user.email },
    pageTitle: { $literal: page.title }, videoTitle: { $literal: target.video.title },
    duration: { $cond: [isNewer, input.duration, "$duration"] },
    position: { $cond: [isNewer, input.position, "$position"] },
    positionObservedAt: { $cond: [isNewer, observedAt, "$positionObservedAt"] },
    updatedAt: { $cond: [isNewer, now, "$updatedAt"] },
    createdAt: { $ifNull: ["$createdAt", now] },
    seconds: { $setUnion: [{ $ifNull: ["$seconds", []] }, { $literal: input.seconds }] }
  } }];
  try {
    await records.updateOne(filter, update, { upsert: true });
  } catch (error) {
    // Two tabs can create the first record at the same time. Merge the second write.
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    await records.updateOne(filter, update);
  }
  return getWatchProgress(user.id, input);
}

export async function getCourseWatchStats(pageSlug: string) {
  return (await collection()).find({ pageSlug }).sort({ updatedAt: -1 }).toArray();
}
