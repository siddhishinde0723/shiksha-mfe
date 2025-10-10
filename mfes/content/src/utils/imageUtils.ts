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
 * Transforms image URLs from Azure Blob Storage to AWS S3 URLs
 * @param imageUrl - The image URL to transform
 * @returns Transformed image URL or fallback to logo.png
 */
export const transformImageUrl = (imageUrl: string): string => {
  console.log("🔄 transformImageUrl (content MFE) - Input:", imageUrl);
  if (!imageUrl) {
    console.log(
      "🔄 transformImageUrl (content MFE) - No imageUrl, returning fallback"
    );
    return "/logo.png";
  }

  if (imageUrl.includes("https://sunbirdsaaspublic.blob.core.windows.net")) {
    console.log("🔄 transformImageUrl (content MFE) - Azure URL detected");

    // Handle double domain pattern
    if (
      imageUrl.includes(
        "https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net"
      )
    ) {
      console.log(
        "🔄 transformImageUrl (content MFE) - Double domain pattern detected"
      );
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        "https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/"
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ""
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ""
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log(
          "🔄 transformImageUrl (content MFE) - Double domain transformed:",
          transformedUrl
        );
        return transformedUrl;
      }
    } else {
      console.log(
        "🔄 transformImageUrl (content MFE) - Single domain pattern detected"
      );
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        "https://sunbirdsaaspublic.blob.core.windows.net/"
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, "");
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ""
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log(
          "🔄 transformImageUrl (content MFE) - Single domain transformed:",
          transformedUrl
        );
        return transformedUrl;
      }
    }
  }

  console.log(
    "🔄 transformImageUrl (content MFE) - No transformation needed, returning original:",
    imageUrl
  );
  return imageUrl;
};

/**
 * Gets the best available image URL from content item
 * @param item - The content item object
 * @param baseUrl - The base URL for the API (optional)
 * @returns The best available image URL
 */
export const getBestImageUrl = (item?: any, baseUrl?: string): string => {
  console.log("🔍 getBestImageUrl - Input:", { item, baseUrl });
  if (!item) {
    console.log("🔍 getBestImageUrl - No item, returning empty string");
    return "";
  }

  // Try posterImage first
  if (item.posterImage) {
    console.log("🔍 getBestImageUrl - Found posterImage:", item.posterImage);
    const transformedUrl = transformImageUrl(item.posterImage);
    const processedUrl = processImageUrl(transformedUrl, baseUrl);
    console.log("🔍 getBestImageUrl - posterImage processed:", processedUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }

  // Try appIcon as fallback
  if (item.appIcon) {
    console.log("🔍 getBestImageUrl - Found appIcon:", item.appIcon);
    const transformedUrl = transformImageUrl(item.appIcon);
    const processedUrl = processImageUrl(transformedUrl, baseUrl);
    console.log("🔍 getBestImageUrl - appIcon processed:", processedUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }
  if (item.appicon) {
    console.log("🔍 getBestImageUrl - Found appicon:", item.appicon);
    const transformedUrl = transformImageUrl(item.appicon);
    const processedUrl = processImageUrl(transformedUrl, baseUrl);
    console.log("🔍 getBestImageUrl - appicon processed:", processedUrl);
    if (processedUrl) {
      return processedUrl;
    }
  }
  // Return fallback image if no image found
  console.log("🔍 getBestImageUrl - No image found, returning fallback");
  return "/logo.png";
};
