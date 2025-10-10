import { post } from '@shared-lib';
import axios, { AxiosRequestConfig } from 'axios';
export interface ContentSearchResponse {
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
  children: [{}];
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
}
// Define the payload

export interface ResultProp {
  QuestionSet?: ContentSearchResponse[];
  content: ContentSearchResponse[];
  count: number;
}
export interface ContentResponse {
  result: ResultProp;
}

export const ContentSearch = async ({
  type,
  query,
  filters,
  limit = 5,
  offset = 0,
}: {
  type: string;
  query?: string;
  filters?: object;
  limit?: number;
  offset?: number;
}): Promise<ContentResponse> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    // Axios request configuration

    const data = {
      request: {
        filters: {
          // identifier: 'do_114228944942358528173',
          // identifier: 'do_1141652605790289921389',
          //need below after login user channel for dynamic load content
          // channel: '0135656861912678406',
          ...filters,
          status: ['live'],
          primaryCategory:
            type?.toLowerCase() === 'course'
              ? ['Course']
              : ['Learning Resource', 'Practice Question Set'],
          channel: localStorage.getItem('channelId'),
        },
        fields: [
          'name',
          'appIcon',
          'description',
          'posterImage',
          'mimeType',
          'identifier',
          'resourceType',
          'primaryCategory',
          'contentType',
          'trackable',
          'children',
          'leafNodes',
        ],
        query,
        limit,
        offset,
      },
    };

    // Execute the request
    const response = await post(
      `${searchApiUrl}/action/composite/v3/search`,
      data
    );
    const res = response?.data;

    return res;
  } catch (error) {
    console.error('Error in ContentSearch:', error);
    throw error;
  }
};

export const CommonContentSearch = async ({
  type,
  query,
  filters,
  limit = 5,
  offset = 0,
}: {
  type: string;
  query?: string;
  filters?: object;
  limit?: number;
  offset?: number;
}): Promise<ContentResponse> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    // Axios request configuration
    if (filters && typeof filters === 'object' && 'program' in filters) {
      // Create a shallow copy to avoid mutating the original filters object
      // const { program, ...restFilters } = filters as { [key: string]: any };
      // filters = restFilters;
      delete filters?.program;
    }
    const data = {
      request: {
        filters: {
          // identifier: 'do_114228944942358528173',
          // identifier: 'do_1141652605790289921389',
          //need below after login user channel for dynamic load content
          // channel: '0135656861912678406',
          primaryCategory:['Course'],
          ...filters,
          status: ['live'],
        
          channel: localStorage.getItem('channelId'),
        },
        fields: [
          'name',
          'appIcon',
          'description',
          'posterImage',
          'mimeType',
          'identifier',
          'resourceType',
          'primaryCategory',
          'contentType',
          'trackable',
          'children',
          'leafNodes',
          'courseType'
        ],
        query,
        limit,
        offset,
      },
    };

    // Execute the request
    const response = await post(
      `${searchApiUrl}/action/composite/v3/search`,
      data
    );
    const res = response?.data;

    return res;
  } catch (error) {
    console.error('Error in ContentSearch:', error);
    throw error;
  }
};

