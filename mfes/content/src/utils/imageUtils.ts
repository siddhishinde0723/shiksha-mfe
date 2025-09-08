/**
 * Utility functions for handling image URLs
 */

/**
 * Processes an image URL to ensure it's a valid absolute URL
 * @param imageUrl - The image URL from the API
 * @param baseUrl - The base URL for the API (optional)
 * @returns A valid image URL
 */
export const processImageUrl = (
  imageUrl?: string,
  baseUrl?: string
): string => {
  if (!imageUrl) {
    return "";
  }

  // If it's already an absolute URL (starts with http/https), return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a relative URL and we have a base URL, construct the full URL
  if (baseUrl) {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    // Remove leading slash from imageUrl if present
    const cleanImageUrl = imageUrl.startsWith("/")
      ? imageUrl.slice(1)
      : imageUrl;
    return `${cleanBaseUrl}/${cleanImageUrl}`;
  }

  // If no base URL provided, return the original URL
  return imageUrl;
};

/**
 * Gets the best available image URL from content item
 * @param item - The content item object
 * @param baseUrl - The base URL for the API (optional)
 * @returns The best available image URL
 */
export const getBestImageUrl = (item?: any, baseUrl?: string): string => {
  if (!item) {
    return "";
  }

  // Try posterImage first
  if (item.posterImage) {
    const processedUrl = processImageUrl(item.posterImage, baseUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }

  // Try appIcon as fallback
  if (item.appIcon) {
    const processedUrl = processImageUrl(item.appIcon, baseUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }
  if (item.appicon) {
    const processedUrl = processImageUrl(item.appicon, baseUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }
  // Return empty string if no image found
  return "";
};
