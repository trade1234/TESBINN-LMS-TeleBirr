const PLACEHOLDER_IMAGE_NAMES = new Set(["default.jpg", "default-course.jpg"]);

export const getSafeImageUrl = (value?: string | null) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || PLACEHOLDER_IMAGE_NAMES.has(normalized)) {
    return null;
  }
  return normalized;
};

export const hasRemoteImageUrl = (value?: string | null) => {
  const safeUrl = getSafeImageUrl(value);
  return Boolean(safeUrl && /^https?:\/\//i.test(safeUrl));
};
