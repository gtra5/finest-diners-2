import { useEffect, useState } from "react";
import img1 from "../assets/image.png";

const UI_FONT = "'Bebas Neue', Impact, 'Arial Black', sans-serif";

export default function MobileBurgerHero({ containerRef, height = 200 }) {
  const [vw, setVw] = useState(390);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef?.current) return;
      setVw(containerRef.current.offsetWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef?.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  const vh = height; // ← independent height control
  const FONT_SIZE = Math.max(110, vw * 0.3);
  const LINE_HEIGHT = FONT_SIZE * 1.0;

  // SVG <text> never wraps on its own — the old fixed 180px floor made the
  // font bigger than most phone screens can hold, so the word just ran off
  // both edges instead of "wrapping." This forces the whole word's total
  // advance width to fit inside the box, compressing spacing/glyphs only
  // as much as needed, so it's always fully visible on one line.
  const FIT_WIDTH = vw * 0.92;

  const getTextProps = (lineIndex) => ({
    x: vw / 2,
    y: FONT_SIZE * 0.82 + lineIndex * LINE_HEIGHT,
    textAnchor: "middle",
    textLength: FIT_WIDTH,
    lengthAdjust: "spacingAndGlyphs",
    style: {
      fontFamily: UI_FONT,
      fontSize: FONT_SIZE,
      fontWeight: 900,
    },
  });

  return (
    <div className="relative w-full">
      <div
        style={{
          position: "relative",
          width: "100%",
          height: vh, // ← explicit height, no aspectRatio
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          preserveAspectRatio="xMidYMid slice" // ← slice fills the box without distortion
        >
          <defs>
            <clipPath id="letterClipMobile">
              <text {...getTextProps(0)}>OUR FOOD</text>
            </clipPath>
          </defs>

          <rect width={vw} height={vh} fill="#6B7C2F" />

          <text {...getTextProps(0)} fill="#111">OUR FOOD</text>

          <g clipPath="url(#letterClipMobile)">
            <image
              href={img1}
              x={0}
              y={0}
              width={vw}
              height={vh}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}