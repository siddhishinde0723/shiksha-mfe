import React from 'react';
import { getMetadata } from '@learner/utils/API/metabaseService';
import ContentPlayerClient from './ContentPlayerClient';

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.identifier);
}

const HomePage: React.FC = () => {
  return <ContentPlayerClient />;
};

export default HomePage;
