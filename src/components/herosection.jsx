import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
} from "framer-motion";

// Dynamically import all food frame images
const frameModules = import.meta.glob('../assets/foodframes/ezgif-frame-*.jpg', { eager: true });

const frames = Array.from({ length: 50 }, (_, i) => {
  const frameNumber = String(i + 1).padStart(3, '0');
  const path = `../assets/foodframes/ezgif-frame-${frameNumber}.jpg`;
  return frameModules[path].default;
});

// How much extra scroll distance (in viewport heights) the hero "eats up"
// while it stays pinned and the video scrubs. Bigger = slower/longer scrub.
const SCROLL_LENGTH_VH = 250;

// Staggered fade-up used for the hero copy on mount.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

// A button that eases toward the cursor while it's nearby, then springs
// back to rest — a light-touch "magnetic" hover, not a gimmick.
function MagneticButton({
  children,
  className,
  strength = 0.3,
  style,
  ...props
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 12, mass: 0.15 });
  const springY = useSpring(y, { stiffness: 150, damping: 12, mass: 0.15 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, ...style }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default function CravHero() {
  const sectionRef = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  // scrollYProgress goes 0 -> 1 as the window scrolls the section's top
  // from the top of the viewport to the section's bottom hitting the
  // bottom of the viewport — i.e. exactly the span it stays pinned for.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Track the latest desired progress cheaply (no seeking here) — this
  // can fire many times per scroll frame and just updates a ref.
  const targetProgress = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    targetProgress.current = latest;
  });

  // Drive the image sequence in its own rAF loop for smooth animation
  useEffect(() => {
    let rafId;

    const tick = () => {
      const frameIndex = Math.floor(targetProgress.current * (frames.length - 1));
      setCurrentFrame(frameIndex);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const scallopedWaveBottom =
    "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 100\"><g transform=\"matrix(1 0 0 -1 0 100)\"><path d=\"M0 0v60c9 0 18-3 25-10 13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s37 13 50 0c14-14 37-14 50 0 7 7 16 10 25 10V0H0Z\" fill=\"%23050A0A\"></path></g></svg>')";

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Tall wrapper: gives the scroll-scrub effect room to play out */}
      <section
        ref={sectionRef}
        className="relative w-full bg-[#6B7C2F]"
        style={{ height: `${SCROLL_LENGTH_VH}vh` }}
      >
        {/* Pinned viewport-height stage — this is what stays on screen
            while the user scrolls through the section above */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
          <img
            src={frames[currentFrame]}
            alt="Food animation frame"
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            style={{ imageRendering: 'auto' }}
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