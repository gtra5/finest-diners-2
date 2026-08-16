import { useEffect, useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import heroPoster from "../assets/foodframes/ezgif-frame-001.jpg";

// How much extra scroll distance (in viewport heights) the hero "eats up"
// while it stays pinned and the video scrubs. Bigger = slower/longer scrub.
const SCROLL_LENGTH_VH = 250;

// The hero animation is a single optimized all-keyframe H.264 MP4
// (`public/hero-food.mp4`) scrubbed by scroll. The video decoder is
// hardware-accelerated, so it stays smooth on any device — unlike decoding
// 50 separate <img> frames, which stalled and ate ~180MB of memory.
export default function CravHero() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  // Latest desired scrub position (0..1), updated cheaply on every scroll
  // event without re-rendering; the rAF loop below reads it.
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    progressRef.current = latest;
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const FPS = 30;
    const EPS = 0.5 / FPS;
    let lastSeek = -1;
    let rafId;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (v.readyState < 1 || !v.duration) return;
      // Quantize to whole frames: seek at most once per animation frame
      // instead of hammering the decoder with redundant micro-seeks.
      const frameIndex = Math.round(progressRef.current * v.duration * FPS);
      const seekTo = frameIndex / FPS;
      if (seekTo !== lastSeek && Math.abs(v.currentTime - seekTo) > EPS) {
        lastSeek = seekTo;
        v.currentTime = seekTo;
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scallopedWaveBottom =
    "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 100\"><g transform=\"matrix(1 0 0 -1 0 100)\"><path d=\"M0 0v60c9 0 18-3 25-10 13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s37 13 50 0c14-14 37-14 50 0 7 7 16 10 25 10V0H0Z\" fill=\"%23050A0A\"></path></g></svg>')";

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* data-navbar keeps the header transparent over the hero so it never
          covers the food images; the overlay starts at the categories below */}
      <section
        ref={sectionRef}
        data-navbar="#transparent"
        className="relative w-full bg-[#6B7C2F]"
        style={{ height: `${SCROLL_LENGTH_VH}vh` }}
      >
        {/* Pinned viewport-height stage — this is what stays on screen
            while the user scrolls through the section above */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            src="/hero-food.mp4"
            poster={heroPoster}
            muted
            loop
            playsInline
            preload="metadata"
          />

          {/* Soft scrim so the finer serif type stays legible over the images */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25 z-[5] pointer-events-none" />

          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              backgroundImage: scallopedWaveBottom,
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%",
              backgroundPosition: "0 0",
              height: "100px",
            }}
          />
        </div>
      </section>
    </>
  );
}
