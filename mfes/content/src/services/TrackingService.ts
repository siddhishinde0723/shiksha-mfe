import { post } from "@shared-lib";

export const trackingData = async (subIds: string[], courseIds: string[]) => {
  const data = {
    userId: subIds,
    courseId: courseIds,
  };

  const trackingApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

  if (!trackingApiUrl) {
    console.error("Tracking API URL is not defined in environment variables.");
    return;
  }
  console.log("Tracking API URL:", trackingApiUrl);

  try {
    const response = await post(`${trackingApiUrl}/tracking/content/course/status`, data);
    return response.data;
  } catch (error) {
    console.error("Error in tracking API:", error);
    throw error;
  }
};
