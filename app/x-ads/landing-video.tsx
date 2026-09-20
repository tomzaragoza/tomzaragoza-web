"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./landing.module.css";

export function LandingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlayback = () => {
      const video = videoRef.current;
      if (!video) return;
      if (motion.matches) video.pause();
      else void video.play().catch(() => {});
    };
    updatePlayback();
    motion.addEventListener("change", updatePlayback);
    return () => motion.removeEventListener("change", updatePlayback);
  }, []);

  return (
    <figure className={styles.preview}>
      <div className={styles.videoFrame}>
        <video
          ref={videoRef}
          src="/videos/x-ads-promo.mp4"
          poster="/images/x-ads-promo.jpg"
          width={1280}
          height={720}
          muted
          loop
          playsInline
          preload="none"
          aria-label="Silent course preview showing X Ads Manager"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
      </div>
      <figcaption>
        <span>{failed ? "Video unavailable. You can still explore the course below." : "A look inside X Ads Manager."}</span>
        {!failed ? <button type="button" aria-label={playing ? "Pause preview" : "Play preview"} onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (playing) video.pause();
          else void video.play().catch(() => setFailed(true));
        }}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing ? "Pause" : "Play"}</button> : null}
      </figcaption>
    </figure>
  );
}
