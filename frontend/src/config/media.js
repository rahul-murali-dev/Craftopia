const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const derivedBaseUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export const MEDIA_BASE_URL = (
  import.meta.env.VITE_MEDIA_URL || derivedBaseUrl
).replace(/\/+$/, "");

/**
 * Resolve a backend media path or absolute URL into a displayable image URL.
 */
export function getImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  const normalizedPath = image.startsWith("/") ? image : `/${image}`;
  return `${MEDIA_BASE_URL}${normalizedPath}`;
}
