import "server-only";
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, GetObjectCommand, HeadObjectCommand, ListPartsCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { courseMediaIds } from "@/lib/course-blocks";

export const COURSE_MEDIA_TYPES: Record<string, { extension: string; folder: string }> = {
  "image/jpeg": { extension: "jpg", folder: "images" }, "image/png": { extension: "png", folder: "images" },
  "image/webp": { extension: "webp", folder: "images" }, "image/gif": { extension: "gif", folder: "images" },
  "video/mp4": { extension: "mp4", folder: "videos" }, "video/webm": { extension: "webm", folder: "videos" },
  "audio/mpeg": { extension: "mp3", folder: "files" }, "audio/mp4": { extension: "m4a", folder: "files" },
  "audio/ogg": { extension: "ogg", folder: "files" }, "audio/wav": { extension: "wav", folder: "files" },
  "application/pdf": { extension: "pdf", folder: "files" }, "text/plain": { extension: "txt", folder: "files" },
  "text/csv": { extension: "csv", folder: "files" }
};
export const COURSE_UPLOAD_PART_SIZE = 16 * 1024 * 1024;
type MediaDocument = {
  id: string; pageSlug: string; key: string; name: string; contentType: string; size: number;
  uploadId: string; status: "uploading" | "ready" | "aborted"; createdAt: Date;
};
const state = globalThis as typeof globalThis & { courseMediaMongo?: MongoClient };
export function courseMediaCollection() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("Course database is not configured.");
  state.courseMediaMongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 10000, ignoreUndefined: true });
  return state.courseMediaMongo.db(process.env.MONGODB_DB || "tomzaragoza").collection<MediaDocument>("x_ads_course_media");
}
export function courseSpaces() {
  const bucket = process.env.DO_SPACES_BUCKET;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const origin = process.env.DO_SPACES_ORIGIN;
  const region = process.env.DO_SPACES_REGION;
  const accessKeyId = process.env.DO_SPACES_ACCESS_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET_KEY;
  if (!bucket || !endpoint || !origin || !region || !accessKeyId || !secretAccessKey) throw new Error("Course media storage is not configured.");
  if (origin !== `https://${bucket}.${new URL(endpoint).host}`) throw new Error("Course media origin does not match the bucket endpoint.");
  return { bucket, client: new S3Client({ endpoint, region, forcePathStyle: false, credentials: { accessKeyId, secretAccessKey }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }) };
}
export async function startCourseUpload(input: { pageSlug: string; name: string; contentType: string; size: number; mainVideo: boolean }) {
  const format = COURSE_MEDIA_TYPES[input.contentType];
  if (!format) throw new Error("Use JPEG, PNG, WebP, GIF, MP4, WebM, audio, PDF, text, or CSV files.");
  if (input.mainVideo && !input.contentType.startsWith("video/")) throw new Error("The main video must be MP4 or WebM.");
  const limit = input.contentType.startsWith("video/") ? 2 * 1024 ** 3 : 50 * 1024 ** 2;
  if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > limit) throw new Error(input.contentType.startsWith("video/") ? "Videos must be less than 2 GB." : "Files must be less than 50 MB.");
  const id = randomUUID();
  const key = `x-ads/${input.pageSlug}/${input.mainVideo ? "main-video" : format.folder}/${id}.${format.extension}`;
  const { client, bucket } = courseSpaces();
  const created = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ACL: "private", ContentType: input.contentType, CacheControl: "private, max-age=0", Metadata: { "course-media-id": id } }));
  if (!created.UploadId) throw new Error("Unable to start the upload.");
  try {
    await courseMediaCollection().insertOne({ ...input, id, key, uploadId: created.UploadId, status: "uploading", createdAt: new Date() });
    const partCount = Math.ceil(input.size / COURSE_UPLOAD_PART_SIZE);
    const urls = await Promise.all(Array.from({ length: partCount }, (_, i) => getSignedUrl(client, new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: created.UploadId, PartNumber: i + 1 }), { expiresIn: 3600 })));
    return { id, urls, partSize: COURSE_UPLOAD_PART_SIZE };
  } catch (error) {
    await client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: created.UploadId })).catch(() => {});
    throw error;
  }
}
export async function finishCourseUpload(id: string, abort = false) {
  const collection = courseMediaCollection();
  const media = await collection.findOne({ id });
  if (!media) throw new Error("Unknown upload.");
  if (media.status === "ready" && !abort) return `/api/course/media/${id}`;
  if (media.status !== "uploading") throw new Error("This upload is closed.");
  const { client, bucket } = courseSpaces();
  const target = { Bucket: bucket, Key: media.key, UploadId: media.uploadId };
  if (abort) {
    await client.send(new AbortMultipartUploadCommand(target));
    await collection.updateOne({ id, status: "uploading" }, { $set: { status: "aborted" } });
    return null;
  }
  // Recover completion if the previous response or database update was interrupted.
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: media.key })).catch(error => {
    if (error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  });
  if (!head) {
    const result = await client.send(new ListPartsCommand(target));
    const parts = result.Parts ?? [];
    if (result.IsTruncated || parts.length !== Math.ceil(media.size / COURSE_UPLOAD_PART_SIZE) || parts.reduce((sum, part) => sum + (part.Size ?? 0), 0) !== media.size || parts.some((part, i) => part.PartNumber !== i + 1 || (i < parts.length - 1 && part.Size !== COURSE_UPLOAD_PART_SIZE))) throw new Error("The upload is incomplete. Retry the file.");
    await client.send(new CompleteMultipartUploadCommand({ ...target, MultipartUpload: { Parts: parts.map(({ ETag, PartNumber }) => ({ ETag, PartNumber })) } }));
  } else if (head.ContentLength !== media.size || head.Metadata?.["course-media-id"] !== id) throw new Error("The uploaded file did not match.");
  await collection.updateOne({ id, status: "uploading" }, { $set: { status: "ready" } });
  return `/api/course/media/${id}`;
}
export async function assertCourseMediaReady(pageSlug: string, value: unknown) {
  const ids = courseMediaIds(value);
  if (!ids.length) return;
  const count = await courseMediaCollection().countDocuments({ id: { $in: ids }, pageSlug, status: "ready" });
  if (count !== ids.length) throw new Error("A file is missing or still uploading. Complete the upload before saving.");
}
export async function courseMediaReadUrl(media: MediaDocument) {
  const { client, bucket } = courseSpaces();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: media.key, ResponseContentType: media.contentType, ResponseCacheControl: "private, no-store", ResponseContentDisposition: `${media.contentType.startsWith("image/") || media.contentType.startsWith("video/") || media.contentType.startsWith("audio/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(media.name)}` }), { expiresIn: 43200 });
}
