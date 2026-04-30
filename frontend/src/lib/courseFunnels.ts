const excludedCourseNames = new Set(["test", "test course"]);

export const isExcludedFunnelCourse = (title?: string) =>
  excludedCourseNames.has((title || "").trim().toLowerCase());
