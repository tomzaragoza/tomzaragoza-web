export type CourseMessageSender = "student" | "tom";

export type CourseThreadMessage = {
  id: string;
  sender: CourseMessageSender;
  body: string;
  createdAt: string;
};

export type PrivateCourseThread = {
  id: string | null;
  unread: boolean;
  participant: {
    name: string;
    image: string | null;
  };
  messages: CourseThreadMessage[];
};

export type PrivateCourseMessageCenterThread = PrivateCourseThread & {
  id: string;
  source: "note" | "annotation";
  pageSlug: string;
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  blockId: string;
  quote: string | null;
  context: string;
  updatedAt: string;
};

export type PrivateCourseAnnotationThread = PrivateCourseMessageCenterThread & {
  source: "annotation";
};

export type AdminCourseThread = PrivateCourseThread & {
  id: string;
  source: "note" | "annotation";
  userName: string;
  userEmail: string;
  userImage: string | null;
  pageSlug: string;
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  context: string;
  blockId: string | null;
  quote: string | null;
  updatedAt: string;
};
