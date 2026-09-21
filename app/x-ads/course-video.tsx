"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Captions, Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { getCourseVideoSource } from "@/lib/course-video";
import { videoResumePosition } from "@/lib/course-watch-shared";
import type { CourseVideo as CourseVideoDefinition } from "@/lib/course-content-shared";
import { useCourseEditing } from "./course-editing-context";
import { useVideoDock } from "./course-video-layout";
import { useWatchProgress } from "./use-watch-progress";
import { CourseEmbedVideo } from "./course-embed-video";
import styles from "./course-video.module.css";

function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function setCaptionVisibility(element: HTMLVideoElement | null, visible: boolean) {
  if (!element) return;
  for (let i = 0; i < element.textTracks.length; i++) element.textTracks[i].mode = visible ? "showing" : "hidden";
}

type Props = { video: CourseVideoDefinition; pageSlug?: string; videoId?: string };
export function CourseVideo(props: Props) {
  return <VideoPlayer key={`${props.pageSlug}:${props.videoId}:${props.video.url}`} {...props} />;
}

function VideoPlayer({ video, pageSlug, videoId = "preview" }: Props) {
  const source = getCourseVideoSource(video.url);
  const { preview } = useCourseEditing();
  const native = useRef<HTMLVideoElement>(null);
  const { slot, player, dock, activate, returnToVideo } = useVideoDock(videoId);
  const canTrack = Boolean(pageSlug && !preview && source && !source.src.startsWith("https://www.loom.com/"));
  const progress = useWatchProgress(canTrack ? { pageSlug: pageSlug!, videoId, source: video.url } : null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(Boolean(video.captionsUrl));
  const [error, setError] = useState("");
  const [trackingError, setTrackingError] = useState(false);
  const restored = useRef(false);
  const interacted = useRef(false);

  useEffect(() => {
    if (!progress.loaded || !duration || restored.current || !native.current) return;
    restored.current = true;
    // A late progress response must never interrupt playback or a manual seek.
    if (!interacted.current && native.current.paused) {
      native.current.currentTime = videoResumePosition(progress.resumePosition, duration);
    }
  }, [progress.loaded, progress.resumePosition, duration]);

  function sample() {
    const element = native.current;
    if (!element) return;
    setPosition(element.currentTime);
    const ranges: [number, number][] = [];
    for (let i = 0; i < element.played.length; i++) ranges.push([element.played.start(i), element.played.end(i)]);
    if (ranges.length) progress.sample(element.currentTime, element.duration, ranges);
  }
  function play() {
    const element = native.current;
    if (!element) return;
    setError("");
    if (element.paused) void element.play().catch(() => setError("The video could not start. Please try again."));
    else element.pause();
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (player.current?.requestFullscreen) await player.current.requestFullscreen();
      else (native.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void } | null)?.webkitEnterFullscreen?.();
    } catch { setError("Fullscreen is not available in this browser."); }
  }
  function toggleCaptions() {
    const next = !captions;
    setCaptionVisibility(native.current, next);
    setCaptions(next);
  }
  if (!source) return null;

  return <figure ref={slot} className={styles.slot} style={dock ? { minHeight: dock.height } : undefined}>
    <div ref={player} className={`${styles.player} ${dock ? styles.docked : ""}`} style={dock?.style} role="group" aria-label={video.title || "Lesson video"}>
      <div className={styles.screen}>
        {source.kind === "embed" ? canTrack && !progress.loaded ? <div className={styles.loading} role="status">Loading video…</div> : <CourseEmbedVideo src={source.src} title={video.title || "Lesson video"} startAt={progress.resumePosition} onSample={progress.sample} onPlay={activate} onPause={progress.flush} onTrackingError={() => setTrackingError(true)} /> : (
          <video ref={native} src={source.src} playsInline preload="metadata" controlsList="nodownload" aria-label={video.title || "Lesson video"}
            onContextMenu={event => event.preventDefault()}
            onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
            onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
            onPlay={() => { interacted.current = true; setPlaying(true); activate(); }}
            onPause={() => { setPlaying(false); sample(); progress.flush(); }}
            onEnded={() => { setPlaying(false); sample(); progress.flush(); }}
            onTimeUpdate={sample}
            onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
            onRateChange={event => setRate(event.currentTarget.playbackRate)}
            onError={() => setError("This video could not load. Refresh the page to try again.")}
          >
            {video.captionsUrl ? <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default /> : null}
          </video>
        )}
      </div>
      {source.kind === "file" && <div className={styles.controls}>
        <input className={styles.seek} type="range" aria-label="Video position" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} disabled={!duration}
          aria-valuetext={`${timeLabel(position)} of ${timeLabel(duration)}`} onChange={event => { if (native.current) { interacted.current = true; native.current.currentTime = Number(event.target.value); setPosition(Number(event.target.value)); } }} />
        <button type="button" onClick={play} aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause /> : <Play />}</button>
        <span className={styles.time}>{timeLabel(position)} / {timeLabel(duration)}</span>
        <button type="button" aria-label={muted ? "Unmute video" : "Mute video"} onClick={() => { if (native.current) native.current.muted = !native.current.muted; }}>{muted || volume === 0 ? <VolumeX /> : <Volume2 />}</button>
        <input className={styles.volume} type="range" aria-label="Volume" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={event => { if (native.current) { native.current.volume = Number(event.target.value); native.current.muted = false; } }} />
        <select aria-label="Playback speed" value={rate} onChange={event => { if (native.current) native.current.playbackRate = Number(event.target.value); }}>
          {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
        {video.captionsUrl && <button type="button" aria-label="Captions" aria-pressed={captions} onClick={toggleCaptions}><Captions /></button>}
        <button type="button" aria-label="Fullscreen" onClick={() => void fullscreen()}><Maximize /></button>
      </div>}
      {(canTrack && !trackingError || dock) && <div className={styles.info}>
        {canTrack && !trackingError && <span className={styles.progress} aria-label="Watch progress">{progress.loaded ? `${progress.percentage}% watched` : "Loading progress…"}</span>}
        {dock && <button className={styles.returnButton} type="button" aria-label="Return video to page" title="Return video to page" onClick={returnToVideo}><ArrowUp /></button>}
      </div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {trackingError && <p className={styles.error} role="status">Watch tracking is unavailable for this embedded video. Refresh to try again.</p>}
      {canTrack && progress.saveError && <p className={styles.error} role="status">Progress could not sync. We will retry while this page is open.</p>}
    </div>
  </figure>;
}
