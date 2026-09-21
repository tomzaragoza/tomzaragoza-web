"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { maxVideoDuration, videoResumePosition, watchedSeconds, watchSummary, type WatchProgress, type WatchTarget } from "@/lib/course-watch-shared";

export function useWatchProgress(target: WatchTarget | null) {
  const state = useRef({ seconds: new Set<number>(), pending: new Set<number>(), duration: 0, position: 0, observedAt: 0, dirty: false });
  const [percentage, setPercentage] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);
  const flushRef = useRef<() => void>(() => {});

  const sample = useCallback((position: number, duration: number, ranges: readonly (readonly [number, number])[]) => {
    if (!Number.isFinite(duration) || duration <= 0 || duration > maxVideoDuration) return;
    const current = state.current;
    current.duration = duration;
    current.position = Math.max(0, Math.min(position, duration));
    current.observedAt = Math.max(Date.now(), current.observedAt + 1);
    current.dirty = true;
    for (const second of watchedSeconds(ranges, duration)) {
      if (!current.seconds.has(second)) {
        current.seconds.add(second);
        current.pending.add(second);
      }
    }
    setPercentage(watchSummary([...current.seconds], duration).percentage);
  }, []);

  const pageSlug = target?.pageSlug;
  const videoId = target?.videoId;
  const source = target?.source;
  useEffect(() => {
    if (!pageSlug || !videoId || !source) return;
    const identity = { pageSlug, videoId, source };
    let disposed = false;
    let saving = false;
    let flushQueued = false;
    const controller = new AbortController();

    function merge(progress: WatchProgress | null) {
      if (!progress) return;
      for (const second of progress.seconds) state.current.seconds.add(second);
      setPercentage(watchSummary([...state.current.seconds], state.current.duration || progress.duration).percentage);
    }
    fetch(`/api/course/watch?${new URLSearchParams(identity)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Progress unavailable");
        const { progress } = await response.json() as { progress: WatchProgress | null };
        if (disposed) return;
        merge(progress);
        setResumePosition(progress ? videoResumePosition(progress.position, progress.duration) : 0);
        setLoaded(true);
      }).catch(() => { if (!disposed) { setSaveError(true); setLoaded(true); } });

    async function flush(leaving = false) {
      const current = state.current;
      if (!leaving && saving) { flushQueued = true; return; }
      if (!current.dirty || !current.duration) return;
      const seconds = [...current.pending].slice(0, 500);
      const position = current.position;
      const observedAt = current.observedAt;
      const body = JSON.stringify({ ...identity, duration: current.duration, position, observedAt, seconds });
      let saved = false;
      if (!leaving) saving = true;
      try {
        const response = await fetch("/api/course/watch", {
          method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true
        });
        if (!response.ok) throw new Error("Save failed");
        const { progress } = await response.json() as { progress: WatchProgress | null };
        for (const second of seconds) current.pending.delete(second);
        current.dirty = current.pending.size > 0 || current.observedAt !== observedAt;
        saved = true;
        if (!disposed) { merge(progress); setSaveError(false); }
      } catch {
        // Keep unsaved intervals for the next retry; playback must keep working.
        if (!disposed) setSaveError(true);
      } finally {
        if (!leaving) {
          saving = false;
          const retry = flushQueued;
          flushQueued = false;
          if (saved && retry && current.dirty && !disposed) void flush();
        }
      }
    }
    flushRef.current = () => { void flush(); };
    const timer = window.setInterval(() => { void flush(); }, 10000);
    const hide = () => { if (document.visibilityState === "hidden") void flush(true); };
    const leave = () => { void flush(true); };
    const online = () => { void flush(); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    window.addEventListener("online", online);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("online", online);
      void flush(true);
    };
  }, [pageSlug, videoId, source]);

  return { percentage, saveError, loaded, resumePosition, sample, flush: () => flushRef.current() };
}
