"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "@/styles/sites/slider-intro.css";

interface SliderIntroMainProps {
  images: string[];
  currentIndex: number;
  onCurrentIndexChange: (idx: number) => void;
  transition?: "none" | "fade" | "slide";
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  duration: {
    display: number;
    transition: number;
  };
}

export default function SliderIntroMain({
  images,
  currentIndex,
  onCurrentIndexChange,
  transition = "fade",
  isPlaying,
  setIsPlaying,
  duration,
}: SliderIntroMainProps) {
  const [prev, setPrev] = useState<number | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (transition === "none") return; // Disable autoplay if transition is none
    if (!isPlaying) return;
    timeoutRef.current = setTimeout(() => {
      setPrev(currentIndex);
      onCurrentIndexChange((currentIndex + 1) % images.length);
    }, duration.display);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, isPlaying, images.length, onCurrentIndexChange, transition, duration.display]);

  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), duration.transition);
    return () => clearTimeout(t);
  }, [prev, duration.transition]);

  if (transition === "slide") {
    // Show prev and current as absolutely positioned, animate current sliding in over prev
    let direction: "left" | "right" = "left";
    if (prev !== null && prev !== currentIndex) {
      direction = currentIndex > prev ? "left" : "right";
    }
    return (
      <div className={`sliderRoot slide`} style={{ overflow: "hidden", position: "relative" }}>
        {images.map((img, idx) => {
          if (idx !== currentIndex && idx !== prev) return null;
          const style: React.CSSProperties = (() => {
            const base: React.CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
              zIndex: idx === currentIndex ? 2 : 1,
              transform: "translateX(0)",
            };
            if (prev !== null && idx === prev) {
              if (direction === "left") {
                base.transform = prev < currentIndex ? "translateX(0)" : "translateX(-100%)";
              } else {
                base.transform = prev > currentIndex ? "translateX(0)" : "translateX(100%)";
              }
            }
            if (prev !== null && idx === currentIndex) {
              base.transform = direction === "left" ? "translateX(100%)" : "translateX(-100%)";
              setTimeout(() => {
                const el = document.getElementById(`slide-img-${idx}`);
                if (el) {
                  el.style.transform = "translateX(0)";
                }
              }, 10);
            }
            return base;
          })();
          return (
            <Image
              key={img}
              id={`slide-img-${idx}`}
              src={img}
              alt={`slide-${idx + 1}`}
              className="slideImg"
              draggable={false}
              width={800}
              height={500}
              style={style}
            />
          );
        })}
        <button
          className="playPauseBtn"
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "Pause slider" : "Play slider"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
      </div>
    );
  }

  // Fade or none (default) fallback
  return (
    <div className={`sliderRoot ${transition}`}>
      {images.map((img: string, idx: number) => {
        let className = "slideImg";
        if (idx === currentIndex) className += " active";
        if (prev !== null && idx === prev) className += " prev";
        return (
          <Image
            key={img}
            src={img}
            alt={`slide-${idx + 1}`}
            className={className}
            draggable={false}
            width={800}
            height={500}
          />
        );
      })}
      {transition !== "none" && (
        <button
          className="playPauseBtn"
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "Pause slider" : "Play slider"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
      )}
    </div>
  );
}
