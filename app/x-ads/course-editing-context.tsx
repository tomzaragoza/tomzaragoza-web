"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CourseEditingState = {
  preview: boolean;
  setPreview: (preview: boolean) => void;
};

const CourseEditingContext = createContext<CourseEditingState>({
  preview: false,
  setPreview: () => {}
});

export function CourseEditingProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState(false);
  return <CourseEditingContext.Provider value={{ preview, setPreview }}>
    {children}
  </CourseEditingContext.Provider>;
}

export function useCourseEditing() { return useContext(CourseEditingContext); }
