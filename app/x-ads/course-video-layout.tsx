"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from "react";
import styles from "./course-video.module.css";

type Layout = {
  root: RefObject<HTMLDivElement | null>;
  activeId: string | null;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  setDockedId: Dispatch<SetStateAction<string | null>>;
};
const VideoLayoutContext = createContext<Layout | null>(null);

export function CourseVideoLayout({ children, firstVideoId }: { children: ReactNode; firstVideoId: string | null }) {
  const root = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(firstVideoId);
  const [dockedId, setDockedId] = useState<string | null>(null);
  const value = useMemo(() => ({ root, activeId, setActiveId, setDockedId }), [activeId]);
  return <VideoLayoutContext.Provider value={value}>
    <div ref={root} className={styles.layout} data-course-video-docked={dockedId !== null}>{children}</div>
  </VideoLayoutContext.Provider>;
}

export function useVideoDock(id: string) {
  const layout = useContext(VideoLayoutContext);
  const slot = useRef<HTMLElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState<{ style: CSSProperties; height: number } | null>(null);
  useEffect(() => {
    if (!layout || layout.activeId !== id || !slot.current) return;
    let threshold: number | null = null;
    let height = 0;
    let frame = 0;
    function measure() {
      frame = 0;
      const element = slot.current;
      const root = layout!.root.current;
      if (!element || !root || !player.current) return;
      const editingToolbar = root.closest("[data-course-editor]")?.querySelector('[aria-label="Course page editing"]');
      const top = Math.max(window.innerWidth <= 820 ? 80 : 24, (editingToolbar?.getBoundingClientRect().bottom ?? 0) + 12);
      const bounds = element.getBoundingClientRect();
      const rootBounds = root.getBoundingClientRect();
      const pastVideo = threshold === null ? bounds.bottom <= top : window.scrollY >= threshold;
      // Stop docking at the end of the lesson. Never cover the page footer.
      const inLesson = rootBounds.bottom > top + 180;
      if (pastVideo && inLesson) {
        if (threshold === null) {
          threshold = window.scrollY + bounds.bottom - top;
          height = bounds.height;
        }
        const width = window.innerWidth >= 1100 ? rootBounds.width * 0.42 : Math.min(rootBounds.width, 460);
        const style = { position: "fixed", left: rootBounds.left, top, width, maxHeight: `calc(100dvh - ${top + 16}px)` } satisfies CSSProperties;
        setDock(previous => previous && previous.style.left === style.left && previous.style.width === width && previous.style.top === top ? previous : { style, height });
        layout!.setDockedId(id);
      } else {
        if (!pastVideo) threshold = null;
        setDock(null);
        layout!.setDockedId(current => current === id ? null : current);
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(layout.root.current!);
    observer.observe(slot.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      setDock(null);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      layout.setDockedId(current => current === id ? null : current);
    };
  }, [layout, id]);
  const activeDock = layout?.activeId === id ? dock : null;
  return {
    slot, player, dock: activeDock,
    activate: () => layout?.setActiveId(id),
    returnToVideo: () => {
      layout?.setActiveId(null);
      slot.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  };
}
