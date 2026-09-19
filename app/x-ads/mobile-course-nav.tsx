"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import styles from "./x-ads.module.css";

export function MobileCourseNav({
  currentPath,
  navigation,
  canEdit = false,
  showMessages = true,
  showAccountControls = true
}: {
  currentPath: string;
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
  showMessages?: boolean;
  showAccountControls?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    function handleWideViewport(event: MediaQueryListEvent) {
      if (event.matches) {
        setOpen(false);
      }
    }

    const wideViewport = window.matchMedia("(min-width: 821px)");
    document.addEventListener("keydown", handleKeyDown);
    wideViewport.addEventListener("change", handleWideViewport);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      wideViewport.removeEventListener("change", handleWideViewport);
    };
  }, [open]);

  function closeMenu(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) {
      menuButtonRef.current?.focus();
    }
  }

  return (
    <div className={styles.mobileNav}>
      <div className={styles.mobileTopbar}>
        <Link className={styles.mobileBrand} href="/x-ads">
          <Image
            className={styles.switcherAvatar}
            src="/images/tom-zaragoza.jpg"
            width={32}
            height={32}
            alt=""
          />
          <span>X Ads Course</span>
        </Link>
        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-course-menu"
          aria-label="Open course menu"
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" />
          </svg>
        </button>
      </div>

      <button
        className={`${styles.mobileBackdrop} ${open ? styles.mobileBackdropOpen : ""}`}
        type="button"
        aria-label="Close course menu"
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        onClick={() => closeMenu()}
      />

      <aside
        ref={panelRef}
        id="mobile-course-menu"
        className={`${styles.mobilePanel} ${open ? styles.mobilePanelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Course menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.mobilePanelHeader}>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="Close course menu"
            onClick={() => closeMenu()}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m4.5 4.5 11 11m0-11-11 11" />
            </svg>
          </button>
        </div>

        <nav className={styles.mobilePanelNav} aria-label="Course navigation">
          <div className={styles.mobileContents}>
            {navigation.map((item, index) => (
              <Link
                className={currentPath === item.path ? styles.mobileActiveLink : ""}
                href={item.path}
                aria-current={currentPath === item.path ? "page" : undefined}
                onClick={() => closeMenu(false)}
                key={item.path}
              >
                <span className={styles.navTitle}>
                  <span className={styles.chapterNumber} aria-hidden="true">
                    {index === 0 ? "—" : String(index).padStart(2, "0")}
                  </span>
                  {item.path === "/x-ads" ? "Introduction" : item.title}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </nav>

        {showAccountControls ? (
          <div className={styles.mobileAccountControls}>
            <AuthControls
              courseAccount
              adminMessages={canEdit}
              showMessages={showMessages}
            />
          </div>
        ) : null}
      </aside>
    </div>
  );
}
