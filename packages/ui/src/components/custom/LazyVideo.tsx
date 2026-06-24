"use client";

import { useEffect, useRef } from "react";

interface LazyVideoProps {
  src: string;
  poster?: string;
}

export function LazyVideo({ src, poster }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      disableRemotePlayback
      disablePictureInPicture
      preload="none"
      poster={poster}
      className="absolute inset-0 z-0 h-full w-full object-cover"
      aria-hidden="true"
    >
      <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  );
}
