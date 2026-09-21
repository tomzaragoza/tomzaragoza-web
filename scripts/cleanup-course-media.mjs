// Dry run by default. Delete only unreferenced media created by this application.
// node --env-file=.env scripts/cleanup-course-media.mjs [--apply]
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { S3Client, DeleteObjectCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { courseMediaIds } from "../lib/course-blocks.ts";
const apply = process.argv.includes("--apply");
const mongo = new MongoClient(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 10000 });
const s3 = new S3Client({ endpoint: process.env.DO_SPACES_ENDPOINT, region: process.env.DO_SPACES_REGION, credentials: { accessKeyId: process.env.DO_SPACES_ACCESS_KEY, secretAccessKey: process.env.DO_SPACES_SECRET_KEY } });
const bucket = process.env.DO_SPACES_BUCKET;
if (!bucket) throw new Error("DO_SPACES_BUCKET is required.");
const db = mongo.db(process.env.MONGODB_DB || "tomzaragoza");
const pages = db.collection("x_ads_course_pages");
const media = db.collection("x_ads_course_media");
function references(page) {
  if (!page) return [];
  return courseMediaIds({ published: { mainVideo: page.mainVideo, content: page.blocks ?? page.content }, draft: page.draft && { mainVideo: page.draft.mainVideo, content: page.draft.blocks ?? page.draft.content } });
}
try {
  const candidates = await media.find({ status: { $in: ["ready", "uploading"] }, createdAt: { $lt: new Date(Date.now() - 7 * 86400000) } }).toArray();
  for (const asset of candidates) {
    if (!asset.key.startsWith(`x-ads/${asset.pageSlug}/`) || !asset.key.includes(asset.id)) continue;
    const page = await pages.findOne({ slug: asset.pageSlug });
    if (references(page).includes(asset.id)) continue;
    console.log(`${apply ? "Removing" : "Would remove"}: ${asset.key} (${asset.status})`);
    if (!apply) continue;
    // A short page lease prevents a save from racing the reference check.
    const token = randomUUID();
    if (page) {
      const leased = await pages.findOneAndUpdate({ slug: asset.pageSlug, $or: [{ mediaCleanupUntil: { $exists: false } }, { mediaCleanupUntil: { $lte: new Date() } }] }, { $set: { mediaCleanupToken: token, mediaCleanupUntil: new Date(Date.now() + 300000) } }, { returnDocument: "after" });
      if (!leased) continue;
      if (references(leased).includes(asset.id)) {
        await pages.updateOne({ slug: asset.pageSlug, mediaCleanupToken: token }, { $unset: { mediaCleanupUntil: "", mediaCleanupToken: "" } });
        continue;
      }
    }
    // Withdraw the file first so new drafts cannot select it during cleanup.
    const locked = await media.findOneAndUpdate({ _id: asset._id, status: asset.status }, { $set: { status: "removing" } }, { returnDocument: "after" });
    if (!locked) {
      await pages.updateOne({ slug: asset.pageSlug, mediaCleanupToken: token }, { $unset: { mediaCleanupUntil: "", mediaCleanupToken: "" } });
      continue;
    }
    try {
      if (references(await pages.findOne({ slug: asset.pageSlug })).includes(asset.id)) {
        await media.updateOne({ _id: asset._id }, { $set: { status: asset.status } });
        continue;
      }
      if (asset.status === "uploading") await s3.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: asset.key, UploadId: asset.uploadId })).catch(error => { if (error.name !== "NoSuchUpload") throw error; });
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: asset.key }));
      await media.updateOne({ _id: asset._id }, { $set: { status: "removed", removedAt: new Date() } });
    } catch (error) {
      await media.updateOne({ _id: asset._id }, { $set: { status: asset.status } });
      throw error;
    } finally {
      await pages.updateOne({ slug: asset.pageSlug, mediaCleanupToken: token }, { $unset: { mediaCleanupUntil: "", mediaCleanupToken: "" } });
    }
  }
  console.log(apply ? "Cleanup complete." : "Dry run complete. Use --apply after reviewing the list.");
} finally { await mongo.close(); }
