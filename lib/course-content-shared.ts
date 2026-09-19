export type CourseTextLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type CourseParagraph =
  | string
  | { content: readonly (string | CourseTextLink)[] };

export type CourseVideo = {
  url: string;
  title?: string;
  captionsUrl?: string;
};

export type CourseContentSection = {
  id?: string;
  heading?: string;
  paragraphs?: readonly CourseParagraph[];
  items?: readonly string[];
  steps?: readonly string[];
  links?: readonly { label: string; href: string }[];
  note?: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption: string;
    source?: string;
    wide?: boolean;
  };
  video?: CourseVideo;
};

export type CoursePageDefinition = {
  path: string;
  title: string;
  description: string;
  outcome?: string;
  content: readonly CourseContentSection[];
};

export type CoursePageRecord = Omit<CoursePageDefinition, "path" | "content"> & {
  slug: string;
  path: string;
  content: readonly (CourseContentSection & { id: string })[];
};

export type CourseNavigationItem = {
  slug: string;
  path: string;
  title: string;
  description: string;
};

export function coursePathForSlug(slug: string) {
  return slug === "introduction" ? "/x-ads" : `/x-ads/${slug}`;
}
