"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { post } from "../RestClient";
import { API_ENDPOINTS } from "../EndUrls";
import {
  BulkAttendanceParams,
  AttendanceStatusListProps,
  AttendancePercentageProps,
  CohortAttendancePercentParam,
  LearnerAttendanceProps,
  MarkAttendanceParams,
  AllCenterAttendancePercentParam,
  OverallAttendancePercentageProps,
} from "@learner/utils/attendance/interfaces";

type MarkAttendanceRequest = MarkAttendanceParams & {
  latitude?: number;
  longitude?: number;
  validLocation?: boolean;
  absentReason?: string;
  lateMark?: boolean;
};

type PostAttendanceListParams = {
  limit: number;
  page: number;
  filters?: Record<string, unknown>;
  facets?: string[];
  sort?: string[];
};

const DEFAULT_CONTEXT = "cohort";

const postAttendanceList = async ({
  limit,
  page,
  filters = {},
  facets,
  sort,
}: PostAttendanceListParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.attendanceList;
  const enrichedFilters: Record<string, unknown> = {
    ...filters,
    context: DEFAULT_CONTEXT,
  };
  try {
    const response = await post(apiUrl, {
      limit,
      page,
      filters: enrichedFilters,
      facets,
      sort,
    });
    return response?.data;
  } catch (error) {
    console.error("Error in fetching attendance list", error);
  }
};

export const bulkAttendance = async ({
  attendanceDate,
  contextId,
  userAttendance,
}: BulkAttendanceParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.bulkAttendance;
  try {
    const response = await post(apiUrl, {
      attendanceDate,
      contextId,
      userAttendance,
      context: DEFAULT_CONTEXT,
    });
    return response?.data;
  } catch (error) {
    console.error("error in marking bulk attendance", error);
  }
};

export const markAttendance = async ({
  userId,
  attendanceDate,
  contextId,
  attendance,
  latitude,
  longitude,
  validLocation,
  absentReason,
  lateMark,
}: MarkAttendanceRequest): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.attendanceCreate;
  try {
    const response = await post(apiUrl, {
      userId,
      attendanceDate,
      contextId,
      attendance,
      context: DEFAULT_CONTEXT,
      latitude,
      longitude,
      validLocation,
      absentReason,
      lateMark,
    });
    return response?.data;
  } catch (error) {
    console.error("error in marking attendance", error);
  }
};

export const attendanceStatusList = async ({
  limit,
  page,
  filters: { fromDate, toDate, contextId, scope },
}: AttendanceStatusListProps): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { fromDate, toDate, contextId, scope },
  });
};

export const attendanceInPercentageStatusList = async ({
  limit,
  page,
  filters: { contextId, scope, toDate, fromDate },
  facets,
}: AttendancePercentageProps): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { contextId, scope, toDate, fromDate },
    facets,
  });
};

export const overallAttendanceInPercentageStatusList = async ({
  limit,
  page,
  filters: { contextId, scope },
  facets,
}: OverallAttendancePercentageProps): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { contextId, scope },
    facets,
  });
};

export const getLearnerAttendanceStatus = async ({
  limit = 300,
  page = 0,
  filters: { contextId, scope, toDate, fromDate, userId },
}: LearnerAttendanceProps): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { contextId, scope, toDate, fromDate, userId },
  });
};

export const getCohortAttendance = async ({
  limit,
  page,
  filters: { scope, fromDate, toDate, contextId },
  facets,
  sort,
}: CohortAttendancePercentParam): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { scope, fromDate, toDate, contextId },
    facets,
    sort,
  });
};

export const getAllCenterAttendance = async ({
  limit,
  page,
  filters: { scope, fromDate, toDate, contextId },
  facets,
}: AllCenterAttendancePercentParam): Promise<any> => {
  return postAttendanceList({
    limit,
    page,
    filters: { scope, fromDate, toDate, contextId },
    facets,
  });
};

export const classesMissedAttendancePercentList = async ({
  filters = {},
  facets,
  sort,
}: {
  filters?: Record<string, unknown>;
  facets?: string[];
  sort?: string[];
}): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.attendanceList;
  const enrichedFilters: Record<string, unknown> = {
    ...filters,
    context: DEFAULT_CONTEXT,
  };
  try {
    const response = await post(apiUrl, {
      filters: enrichedFilters,
      facets,
      sort,
    });
    return response?.data;
  } catch (error) {
    console.error("Error in fetching attendance list", error);
  }
};

