import React from 'react';
import dynamic from 'next/dynamic';
import { getMetadata } from '@learner/utils/API/metabaseService';

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.identifier);
}

const Player = dynamic(() => import('@learner/components/Content/Player'), {
  ssr: false,
});

const App: React.FC = () => {
  return <Player />;
};

export default App;
