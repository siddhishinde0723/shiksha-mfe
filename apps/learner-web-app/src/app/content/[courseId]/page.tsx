// pages/content-details/[identifier].tsx

import React from 'react';
import { getMetadata } from '@learner/utils/API/metabaseService';
import CourseUnitClient from './CourseUnitClient';

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.courseId);
}

const App = () => {
  return <CourseUnitClient />;
};

export default App;
