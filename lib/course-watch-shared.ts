import { z } from "zod";

export const maxVideoDuration = 6 * 60 * 60;
export const watchTargetSchema = z.object({
  pageSlug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  videoId: z.string().min(1).max(160).regex(/^[a-zA-Z0-9_:-]+$/),
  source: z.string().min(1).max(2048)
});
export const watchUpdateSchema = watchTargetSchema.extend({
  duration: z.number().finite().positive().max(maxVideoDuration),
  position: z.number().finite().nonnegative().max(maxVideoDuration),
  observedAt: z.number().int().positive().refine(value => value <= Date.now() + 60000).optional(),
  seconds: z.array(z.number().int().nonnegative().max(maxVideoDuration - 1)).max(500)
}).refine(input => input.position <= input.duration && input.seconds.every(second => second < input.duration), {
  message: "Playback progress is outside the video duration."
});

export type WatchTarget = z.infer<typeof watchTargetSchema>;
export type WatchUpdate = z.infer<typeof watchUpdateSchema>;
export type WatchProgress = { seconds: number[]; duration: number; position: number; percentage: number };

export function videoResumePosition(position: number, duration: number) {
  if (!Number.isFinite(position) || !Number.isFinite(duration) || position <= 0 || duration <= 0 || position >= duration - 0.1) return 0;
  return position;
}

// Count complete one-second intervals. The final, shorter interval counts at the end.
// Seeking never creates a played range, and repeated ranges never add extra credit.
export function watchedSeconds(ranges: readonly (readonly [number, number])[], duration: number) {
  const seconds = new Set<number>();
  if (!Number.isFinite(duration) || duration <= 0 || duration > maxVideoDuration) return [];
  for (const [start, end] of ranges) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    for (let second = Math.max(0, Math.ceil(start - 0.001)); second < Math.min(end, duration); second++) {
      if (end + 0.001 >= Math.min(second + 1, duration)) seconds.add(second);
    }
  }
  return [...seconds];
}

export function watchSummary(seconds: readonly number[], duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return { watched: 0, percentage: 0 };
  const watched = [...new Set(seconds)].reduce((total, second) =>
    total + (Number.isInteger(second) && second >= 0 && second < duration ? Math.min(1, duration - second) : 0), 0);
  return { watched, percentage: Math.min(100, Math.floor(watched / duration * 100 + 0.000001)) };
}
