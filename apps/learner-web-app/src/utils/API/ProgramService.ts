import axios from "axios";
import { API_ENDPOINTS } from "./EndUrls";
import { post } from "@shared-lib";

const TENANT_RESULT_KEYS = ["result", "data"];

const getNestedArray = (source: any, keyVariants: string[]): any[] => {
  for (const key of keyVariants) {
    const value = source?.[key];
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === "object") {
      const nestedList =
        Array.isArray(value?.data) && value.data.length
          ? value.data
          : Array.isArray(value?.list) && value.list.length
          ? value.list
          : [];
      if (nestedList.length) {
        return nestedList;
      }
    }
  }
  return [];
};

const extractAcademicYearDetails = (tenant: any) => {
  const academicYearCandidates = getNestedArray(tenant, [
    "academicYears",
    "academicYearList",
  ]);

  const paramCandidates = getNestedArray(tenant?.params ?? {}, [
    "academicYears",
    "academicYearList",
  ]);

  const programCandidates = getNestedArray(tenant, ["programAcademicYear"]);
  const programParamCandidates = getNestedArray(tenant?.params ?? {}, [
    "programAcademicYear",
  ]);

  const combinedList = [
    ...academicYearCandidates,
    ...paramCandidates,
    ...programCandidates,
    ...programParamCandidates,
  ];

  const normalizedList = combinedList
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { id: item, name: item };
      }
      const id =
        item?.id ??
        item?.academicYearId ??
        item?.academic_year_id ??
        item?.value ??
        null;
      if (!id) return null;
      const name =
        item?.name ??
        item?.yearName ??
        item?.label ??
        item?.displayName ??
        item?.title ??
        id;
      return { id, name };
    })
    .filter(Boolean);

  const fallbackId =
    tenant?.academicYearId ??
    tenant?.params?.academicYearId ??
    tenant?.params?.academicYear?.id ??
    tenant?.programAcademicYearId ??
    tenant?.params?.programAcademicYearId ??
    null;

  const academicYearId =
    normalizedList[0]?.id ??
    fallbackId ??
    (typeof tenant?.params?.academicYear === "string"
      ? tenant.params.academicYear
      : tenant?.params?.academicYear?.id) ??
    null;

  return {
    academicYearId,
    academicYearList: normalizedList,
  };
};

export const getTenantInfo = async (): Promise<any> => {
  const apiUrl = API_ENDPOINTS.program;

  try {
    const response = await axios.get(apiUrl);

    return response?.data;
  } catch (error) {
    console.error("Error in fetching tenant info", error);
    throw null;
  }
};

const findTenantRecord = (tenants: any[], tenantId: string) => {
  if (!Array.isArray(tenants)) {
    return null;
  }

  return (
    tenants.find(
      (tenant) =>
        tenant?.tenantId === tenantId ||
        tenant?.id === tenantId ||
        tenant?.identifier === tenantId
    ) ?? null
  );
};

export const ensureAcademicYearForTenant = async (
  tenantId: string
): Promise<string | null> => {
  if (typeof window === "undefined" || !tenantId) {
    return null;
  }

  const existingAcademicYear = localStorage.getItem("academicYearId");
  if (existingAcademicYear) {
    return existingAcademicYear;
  }

  try {
    const tenantResponse = await getTenantInfo();

    const tenantsArray =
      TENANT_RESULT_KEYS.reduce<any[]>(
        (acc, key) =>
          acc.length
            ? acc
            : Array.isArray(tenantResponse?.[key])
            ? tenantResponse[key]
            : Array.isArray(tenantResponse?.[key]?.result)
            ? tenantResponse[key].result
            : [],
        []
      ) || [];

    const tenantRecord = findTenantRecord(tenantsArray, tenantId);

    if (!tenantRecord) {
      console.warn(
        "ensureAcademicYearForTenant: Tenant not found for tenantId",
        tenantId
      );
      return null;
    }

    const { academicYearId, academicYearList } =
      extractAcademicYearDetails(tenantRecord);

    if (academicYearList.length) {
      localStorage.setItem(
        "academicYearList",
        JSON.stringify(academicYearList)
      );
    }

    if (academicYearId) {
      localStorage.setItem("academicYearId", academicYearId);
      return academicYearId;
    }
    console.warn(
      "ensureAcademicYearForTenant: Unable to resolve academic year for tenant",
      tenantId
    );
    return null;
  } catch (error) {
    console.error("Failed to ensure academic year for tenant", error);
    return null;
  }
};

export const FetchDoIds = async (userId: any[]): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.fetchCourseId;

  try {
    const response = await post(apiUrl, {
      userId: userId,
    });
    return response?.data;
  } catch (error) {
    console.error("error in login", error);
    throw error;
  }
};
