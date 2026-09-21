"use client";

import { useEffect, useEffectEvent, useRef } from "react";

type YouTubePlayer = { getCurrentTime(): number; getDuration(): number; getPlaybackRate(): number; getPlayerState(): number; destroy(): void };
type VimeoPlayer = { on(event: string, callback: () => void): void; getPlayed(): Promise<[number, number][]>; getCurrentTime(): Promise<number>; getDuration(): Promise<number>; destroy(): Promise<void> };
type PlayerWindow = Window & {
  YT?: { Player: new (frame: HTMLIFrameElement, options: { events: { onStateChange(event: { data: number }): void } }) => YouTubePlayer };
  Vimeo?: { Player: new (frame: HTMLIFrameElement) => VimeoPlayer };
};
const scripts = new Map<string, Promise<void>>();
function loadPlayerScript(src: string, ready: () => boolean) {
  if (ready()) return Promise.resolve();
  if (!scripts.has(src)) {
    scripts.set(src, new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      const deadline = Date.now() + 15000;
      const timer = window.setInterval(() => {
        if (ready()) { clearInterval(timer); resolve(); }
        else if (Date.now() > deadline) { clearInterval(timer); script.remove(); reject(new Error("Player API unavailable")); }
      }, 100);
      script.onerror = () => { clearInterval(timer); script.remove(); reject(new Error("Player API unavailable")); };
      document.head.append(script);
    }).catch(error => { scripts.delete(src); throw error; }));
  }
  return scripts.get(src)!;
}

export function CourseEmbedVideo({ src, title, startAt = 0, onSample, onPlay, onPause, onTrackingError }: {
  src: string; title: string; startAt?: number;
  onSample: (position: number, duration: number, ranges: readonly (readonly [number, number])[]) => void;
  onPlay: () => void; onPause: () => void; onTrackingError: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const fail = useEffectEvent(onTrackingError);
  const sample = useEffectEvent(onSample);
  const play = useEffectEvent(onPlay);
  const pause = useEffectEvent(onPause);
  useEffect(() => {
    const container = host.current!;
    const frame = document.createElement("iframe");
    const url = new URL(src);
    const youtube = url.hostname === "www.youtube-nocookie.com";
    const vimeo = url.hostname === "player.vimeo.com";
    if (youtube) { url.searchParams.set("enablejsapi", "1"); url.searchParams.set("origin", window.location.origin); url.searchParams.set("playsinline", "1"); }
    if (startAt > 0) {
      if (youtube) url.searchParams.set("start", String(Math.floor(startAt)));
      if (vimeo) url.hash = `t=${Math.floor(startAt)}s`;
    }
    frame.src = url.toString();
    frame.title = title;
    frame.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    container.append(frame);
    let disposed = false;
    let cleanup = () => {};
    const sdk = window as PlayerWindow;
    async function connect() {
      if (youtube) {
        await loadPlayerScript("https://www.youtube.com/iframe_api", () => Boolean(sdk.YT?.Player));
        if (disposed) return;
        let start: number | null = null;
        let previous = 0;
        let clock = performance.now();
        function tick() {
          const position = player.getCurrentTime();
          const duration = player.getDuration();
          const now = performance.now();
          const delta = position - previous;
          const expected = (now - clock) / 1000 * player.getPlaybackRate();
          if (start !== null && delta >= 0 && delta <= expected + 0.2) sample(position, duration, [[start, position]]);
          else start = position;
          previous = position;
          clock = now;
        }
        const player = new sdk.YT!.Player(frame, { events: { onStateChange(event) {
          if (disposed) return;
          if (event.data === 1) { start = previous = player.getCurrentTime(); clock = performance.now(); play(); }
          else {
            if (start !== null) tick();
            start = null;
            if (event.data === 0 || event.data === 2) pause();
          }
        } } });
        const timer = window.setInterval(() => { if (player.getPlayerState?.() === 1) tick(); }, 250);
        cleanup = () => { clearInterval(timer); player.destroy(); };
      } else if (vimeo) {
        await loadPlayerScript("https://player.vimeo.com/api/player.js", () => Boolean(sdk.Vimeo?.Player));
        if (disposed) return;
        const player = new sdk.Vimeo!.Player(frame);
        let reading = false;
        async function tick(flush = false) {
          if (reading && !flush) return;
          reading = true;
          try {
            const [position, duration, ranges] = await Promise.all([player.getCurrentTime(), player.getDuration(), player.getPlayed()]);
            if (!disposed) { sample(position, duration, ranges); if (flush) pause(); }
          } catch { if (!disposed) fail(); }
          finally { reading = false; }
        }
        player.on("play", () => { play(); });
        player.on("timeupdate", () => { void tick(); });
        player.on("pause", () => { void tick(true); });
        player.on("ended", () => { void tick(true); });
        cleanup = () => { void player.destroy().catch(() => {}); };
      }
    }
    void connect().catch(() => { if (!disposed) fail(); });
    return () => { disposed = true; cleanup(); frame.remove(); };
  }, [src, title, startAt]);
  return <div ref={host} />;
}
