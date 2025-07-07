"use client";
import IntroSliderThumbs from "./SliderIntroThumbs";
import IntroSliderMain from "./SliderIntroMain";
import { useState } from "react";

interface SliderIntroProps {
  images: string[];
  transition?: "none" | "fade" | "slide";
  duration?: {
    display: number;
    transition: number;
  };
}

export default function SliderIntro({
  images,
  transition = "fade",
  duration = { display: 4000, transition: 1000 },
}: SliderIntroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleThumbClick = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(false);
  };

  return (
    <>
      <IntroSliderMain
        images={images}
        currentIndex={currentIndex}
        onCurrentIndexChange={setCurrentIndex}
        transition={transition}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        duration={duration}
      />
      <IntroSliderThumbs images={images} currentIndex={currentIndex} onThumbClick={handleThumbClick} />
    </>
  );
}
