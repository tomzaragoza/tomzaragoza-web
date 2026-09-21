"use client";

import { useEffect, useRef } from "react";
import styles from "./landing.module.css";

export function LandingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
        />
      </div>
    </figure>
  );
}
