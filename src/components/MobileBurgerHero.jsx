import { useEffect, useState } from "react";
import img1 from "../assets/delicious-burger-with-fresh-ingredients.jpg";

const UI_FONT = "'Bebas Neue', Impact, 'Arial Black', sans-serif";
const LINES = ["OUR", "BURGERS"];

export default function MobileBurgerHero({ containerRef, height = 230 }) {
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

  // The word wraps onto two lines ("OUR" / "FOOD") like the desktop strip
  // wraps when space runs out. Each line is its own <text> element (SVG
  // <text> never wraps on its own). The block is anchored to the left edge,
  // and the font is sized so both lines fill the banner height — bigger
  // letters plus letter-spacing make the food inside them stretch wider.
  const FONT_SIZE = Math.min(Math.max(100, vw * 0.34), vh * 0.5);
  const LINE_HEIGHT = FONT_SIZE * 0.96;
  const TOP_OFFSET = (vh - (LINE_HEIGHT + FONT_SIZE)) / 2;
  const LEFT_OFFSET = vw * 0.06;

  const getTextProps = (lineIndex) => ({
    x: LEFT_OFFSET,
    y: TOP_OFFSET + FONT_SIZE * 0.72 + lineIndex * LINE_HEIGHT,
    textAnchor: "start",
    letterSpacing: "0.06em",
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
              {LINES.map((line, i) => (
                <text key={i} {...getTextProps(i)}>
                  {line}
                </text>
              ))}
            </clipPath>
          </defs>

          <rect width={vw} height={vh} fill="#6B7C2F" />

          {LINES.map((line, i) => (
            <text key={i} {...getTextProps(i)} fill="#111">
              {line}
            </text>
          ))}

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