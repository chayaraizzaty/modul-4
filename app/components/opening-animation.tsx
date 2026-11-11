"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FRAMES = [
  "/opening/Desktop%20-%2067.png",
  "/opening/Desktop%20-%2049.png",
  "/opening/Desktop%20-%2068.png",
  "/opening/Desktop%20-%2069.png",
  "/opening/Desktop%20-%2052.png",
  "/opening/Desktop%20-%2064.png",
  "/opening/Desktop%20-%2054.png",
  "/opening/Desktop%20-%2055.png",
  "/opening/Desktop%20-%2056.png",
  "/opening/Desktop%20-%2065.png",
  "/opening/Desktop%20-%2066.png",
] as const;

const FRAME_HOLD_MS = 600;
const CROSSFADE_MS = 300;
const FINAL_FRAME_HOLD_MS = 1400;

export default function OpeningAnimation() {
  const router = useRouter();
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState<Set<string>>(
    () => new Set(),
  );
  const [failedFrame, setFailedFrame] = useState<string | null>(null);

  useEffect(() => {
    const isFinalFrame = activeFrameIndex === FRAMES.length - 1;
    const currentFrameIsLoaded = loadedFrames.has(FRAMES[activeFrameIndex]);
    const nextFrameIsLoaded =
      isFinalFrame || loadedFrames.has(FRAMES[activeFrameIndex + 1]);

    if (!currentFrameIsLoaded || !nextFrameIsLoaded || failedFrame !== null) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        if (isFinalFrame) {
          router.replace("/sign-in");
        } else {
          setActiveFrameIndex((currentIndex) => currentIndex + 1);
        }
      },
      isFinalFrame ? FINAL_FRAME_HOLD_MS : FRAME_HOLD_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [activeFrameIndex, failedFrame, loadedFrames, router]);

  return (
    <main className="opening-screen">
      <div
        aria-label="Animasi pembuka PIAI GYM"
        className="opening-stage"
        role="img"
      >
        {FRAMES.map((src, index) => (
          <Image
            key={src}
            alt=""
            className={`opening-frame${activeFrameIndex === index ? " opening-frame-active" : ""}`}
            fill
            loading="eager"
            onError={() => setFailedFrame(src)}
            onLoad={() => {
              setLoadedFrames((currentFrames) => {
                if (currentFrames.has(src)) {
                  return currentFrames;
                }

                const nextFrames = new Set(currentFrames);
                nextFrames.add(src);
                return nextFrames;
              });
            }}
            sizes="100vw"
            src={src}
            style={{
              objectFit: "cover",
              transitionDuration: `${CROSSFADE_MS}ms`,
            }}
            unoptimized
          />
        ))}
      </div>
      {failedFrame !== null && (
        <p className="opening-error" role="alert">
          Gagal memuat frame opening: {failedFrame}
        </p>
      )}
    </main>
  );
}
