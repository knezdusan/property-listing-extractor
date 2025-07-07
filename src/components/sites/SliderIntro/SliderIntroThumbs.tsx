"use client";
import Image from "next/image";
import "@/styles/sites/slider-intro.css";

interface SliderIntroThumbsProps {
  images: string[];
  currentIndex: number;
  onThumbClick: (idx: number) => void;
}

export default function SliderIntroThumbs({ images, currentIndex, onThumbClick }: SliderIntroThumbsProps) {
  // To visually rotate thumbs, start from currentIndex+1 and wrap
  const orderedThumbs = images
    .map((img, idx) => ({ img, idx }))
    .filter(({ idx }) => idx !== currentIndex)
    .sort(
      (a, b) =>
        ((a.idx - (currentIndex + 1) + images.length) % images.length) -
        ((b.idx - (currentIndex + 1) + images.length) % images.length)
    );

  return (
    <div className="sliderThumbs">
      {orderedThumbs.map(({ img, idx }) => (
        <button
          key={img}
          className="thumbWrapper"
          type="button"
          onClick={() => onThumbClick(idx)}
          aria-label={`Show slide ${idx + 1}`}
          tabIndex={0}
        >
          <Image src={img} alt={`thumb-${idx + 1}`} width={80} height={60} className="thumbImg" draggable={false} />
        </button>
      ))}
    </div>
  );
}
