import React, { useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Flex } from '@chakra-ui/react';
import animationData from './launderer.json';

function Animation() {
  const lottieRef = useRef(null);

  const setAnimationSpeed = (speed) => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  };

  const playSegmentsTwice = () => {
    if (lottieRef.current) {
      lottieRef.current.playSegments([0, lottieRef.current.totalFrames], true);
      setTimeout(
        () => {
          lottieRef.current.playSegments(
            [0, lottieRef.current.totalFrames],
            true
          );
        },
        (lottieRef.current.totalFrames / lottieRef.current.getDuration()) * 1000
      );
    }
  };

  useEffect(() => {
    setAnimationSpeed(1.5);
    playSegmentsTwice();
  }, []);

  return (
    <Flex align="center" justify="center" height="100vh">
      <Lottie
        animationData={animationData}
        style={{ height: '15rem' }}
        lottieRef={lottieRef}
      />
    </Flex>
  );
}

export default Animation;
