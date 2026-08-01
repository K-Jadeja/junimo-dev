"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { MediaAsset } from "@/data/portfolio";

type ProjectMediaProps = {
  media: MediaAsset;
  projectName: string;
  priority?: boolean;
  quiet?: boolean;
  className?: string;
};

export function ProjectMedia({ media, projectName, priority = false, quiet = false, className }: ProjectMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (media.type !== "video" || !videoRef.current) return;

    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reducedMotion) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: "220px 0px", threshold: 0.05 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [media.type]);

  return (
    <div className={`project-media ${quiet ? "project-media--quiet" : ""} ${className ?? ""}`.trim()} style={{ aspectRatio: media.aspectRatio ?? "16 / 10" }}>
      {media.type === "image" ? (
        <Image
          src={media.src}
          alt={media.alt}
          width={1600}
          height={1000}
          priority={priority}
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1440px) calc(100vw - 80px), 1360px"
          className="project-media__asset"
        />
      ) : (
        <video
          ref={videoRef}
          className="project-media__asset"
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${projectName} project demo`}
        />
      )}
    </div>
  );
}
