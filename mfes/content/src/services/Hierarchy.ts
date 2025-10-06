import { get } from "@shared-lib";
interface ContentSearchResponse {
  ownershipType?: string[];
  publish_type?: string;
  copyright?: string;
  se_gradeLevelIds?: string[];
  keywords?: string[];
  subject?: string[];
  targetMediumIds?: string[];
  channel?: string;
  downloadUrl?: string;
  organisation?: string[];
  language?: string[];
  mimeType?: string;
  variants?: {
    spine?: {
      ecarUrl?: string;
      size?: string;
    };
    online?: {
      ecarUrl?: string;
      size?: string;
    };
  };
  leafNodes?: string[];
  targetGradeLevelIds?: string[];
  objectType?: string;
  se_mediums?: string[];
  appIcon?: string;
  primaryCategory?: string;
  contentEncoding?: string;
  lockKey?: string;
  generateDIALCodes?: string;
  totalCompressedSize?: number;
  mimeTypesCount?: Record<string, number>;
  contentType?: string;
  se_gradeLevels?: string[];
  trackable?: {
    enabled?: string;
    autoBatch?: string;
  };
  identifier?: string;
  audience?: string[];
  se_boardIds?: string[];
  subjectIds?: string[];
  toc_url?: string;
  visibility?: string;
  contentTypesCount?: Record<string, number>;
  author?: string;
  consumerId?: string;
  childNodes?: string[];
  children?: any[]; // Changed from string[] to any[] to match actual API response
  discussionForum?: {
    enabled?: string;
  };
  mediaType?: string;
  osId?: string;
  graph_id?: string;
  nodeType?: string;
  lastPublishedBy?: string;
  version?: number;
  se_subjects?: string[];
  license?: string;
  size?: number;
  lastPublishedOn?: string;
  name?: string;
  attributions?: string[];
  targetBoardIds?: string[];
  status?: string;
  code?: string;
  publishError?: string | null;
  credentials?: {
    enabled?: string;
  };
  prevStatus?: string;
  description?: string;
  posterImage?: string;
  idealScreenSize?: string;
  createdOn?: string;
  se_boards?: string[];
  targetSubjectIds?: string[];
  se_mediumIds?: string[];
  copyrightYear?: number;
  contentDisposition?: string;
  additionalCategories?: string[];
  lastUpdatedOn?: string;
  dialcodeRequired?: string;
  createdFor?: string[];
  creator?: string;
  os?: string[];
  se_subjectIds?: string[];
  se_FWIds?: string[];
  targetFWIds?: string[];
  pkgVersion?: number;
  versionKey?: string;
  migrationVersion?: number;
  idealScreenDensity?: string;
  framework?: string;
  depth?: number;
  s3Key?: string;
  lastSubmittedOn?: string;
  createdBy?: string;
  compatibilityLevel?: number;
  leafNodesCount?: number;
  userConsent?: string;
  resourceType?: string;
  node_id?: number;
  relational_metadata?: string; // Added to support courses with hierarchical structure in metadata
}
// Define the payload

export const hierarchyAPI = async (
  doId: string,
  params?: object
): Promise<ContentSearchResponse> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      console.error("NEXT_PUBLIC_MIDDLEWARE_URL environment variable is not configured");
      throw new Error("Search API URL environment variable is not configured");
    }

    // Validate doId
    if (!doId) {
      console.error("Content ID (doId) is required");
      throw new Error("Content ID is required");
    }

    // Build URL with query parameters if provided
    let url = `${searchApiUrl}/action/content/v3/hierarchy/${doId}`;
    if (params) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    console.log("Making hierarchy API request to:", url);

    // Check if we're in browser environment before accessing localStorage
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem("tenantId") || '' : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") || '' : '';

    if (!token) {
      console.warn("No authentication token found");
    }

    // Execute the request using the authenticated get function
    const response = await get(
      url,
      {
        tenantId,
        Authorization: `Bearer ${token}`,
      }
    );

    console.log("Hierarchy API response:", response);

    if (!response?.data?.result?.content) {
      console.error("Invalid response structure:", response);
      throw new Error("Invalid response from hierarchy API");
    }

    const res = response.data.result.content;
    return res;
  } catch (error) {
    console.error("Error in hierarchyAPI:", {
      error: error,
      doId: doId,
      url: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/action/content/v3/hierarchy/${doId}`,
      hasToken: typeof window !== 'undefined' ? !!localStorage.getItem("token") : false,
    });
    throw error;
  }
};
