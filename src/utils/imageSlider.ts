"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to manage an interactive image slider.
 *
 * @param imageUrls - An array of image URLs to be displayed in the slider.
 * @param duration - The duration (in milliseconds) for automatic slide transitions.
 * @returns An object containing the current main image, an array of thumbnail images,
 *          a function to handle thumbnail clicks, a function to pause/resume the slider,
 *          and the current paused state.
 */
export const useImageSlider = (imageUrls: string[], duration: number = 3000) => {
  const [images, setImages] = useState(imageUrls);
  const [transitionImage, setTransitionImage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cycleImages = useCallback(() => {
    if (images.length < 2 || isFading) return;

    setTransitionImage(images[1]);

    setTimeout(() => setIsFading(true), 10);

    setTimeout(() => {
      setImages((prevImages) => {
        const [first, ...rest] = prevImages;
        return [...rest, first];
      });
      setIsFading(false);
      setTransitionImage(null);
    }, 510); // 500ms transition + 10ms delay
  }, [images, isFading]);

  const startSlider = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(cycleImages, duration);
  }, [cycleImages, duration]);

  useEffect(() => {
    setImages(imageUrls);
  }, [imageUrls]);

  useEffect(() => {
    if (!isPaused && imageUrls.length > 1) {
      startSlider();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, imageUrls.length, startSlider]);

  const handleThumbnailClick = useCallback(
    (clickedIndex: number) => {
      if (isFading || images.length < 2) return;

      const targetImage = images[clickedIndex + 1];
      if (!targetImage || targetImage === images[0]) return;

      setIsPaused(true);
      setTransitionImage(targetImage);

      setTimeout(() => setIsFading(true), 10);

      setTimeout(() => {
        setImages((prevImages) => {
          const newMain = prevImages[clickedIndex + 1];
          const remaining = prevImages.filter((img) => img !== newMain);
          return [newMain, ...remaining];
        });
        setIsFading(false);
        setTransitionImage(null);
      }, 510); // 500ms transition + 10ms delay
    },
    [isFading, images]
  );

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const mainImage = images[0] || null;
  const thumbnailImages = images.slice(1);

  return { mainImage, transitionImage, thumbnailImages, handleThumbnailClick, togglePause, isPaused, isFading };
};
