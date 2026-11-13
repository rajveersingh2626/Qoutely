import React from 'react';
import { Composition } from 'remotion';
import { QoutelyLinkedInDemo } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QoutelyLinkedInDemo"
        component={QoutelyLinkedInDemo}
        durationInFrames={900} // 30 seconds at 30 fps (punchy, high-energy, fast-paced)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
