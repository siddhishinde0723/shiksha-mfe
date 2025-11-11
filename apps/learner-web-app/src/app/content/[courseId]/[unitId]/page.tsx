// pages/content-details/[identifier].tsx

import React from "react";
import { getMetadata } from "@learner/utils/API/metabaseService";
import CourseUnitDetailsClient from "./CourseUnitDetailsClient";

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.courseId);
}

const App = () => {
  return <CourseUnitDetailsClient />;
};

export default App;
