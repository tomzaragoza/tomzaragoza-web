"use client";

import dynamic from "next/dynamic";
const CourseRichEditor = dynamic(() => import("./course-rich-editor"), { ssr: false, loading: () => <p>Loading page editor…</p> });
export { CourseRichEditor as InlineCourseEditor };
