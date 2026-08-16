import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!ffmpegPath) {
  console.error("ffmpeg-static not found. Run: npm i -D ffmpeg-static");
  process.exit(1);
}

const run = (label, args) => {
  console.log(`\n▶ ${label}`);
  execFileSync(ffmpegPath, args, { stdio: "inherit" });
};

// 1) Home hero: 50 food frames -> one all-keyframe H.264 MP4 (perfect scroll
//    scrubbing, single HTTP request, hardware-decoded instead of 50 <img>s).
//    Frames are already 1280x720 — we keep that resolution. Upscaling to
//    1080p only re-bakes the same 720p detail into 2.25x more pixels and
//    ~70% more bytes, which is pure waste for a scroll-scrubbed background.
const framesDir = path.join(root, "src", "assets", "foodframes");
const framesGlob = path.join(framesDir, "ezgif-frame-%03d.jpg");
const heroOut = path.join(root, "public", "hero-food.mp4");
if (fs.existsSync(framesDir)) {
  run("Encoding home hero (hero-food.mp4, 720p, all-intra)", [
    "-y",
    "-framerate",
    "30",
    "-i",
    framesGlob,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "26",
    "-pix_fmt",
    "yuv420p",
    "-g",
    "1",
    "-movflags",
    "+faststart",
    heroOut,
  ]);
  const size = (fs.statSync(heroOut).size / 1024 / 1024).toFixed(2);
  console.log(`   → ${heroOut} (${size} MB)`);
} else {
  console.warn(`   ! ${framesDir} not found, skipping`);
}

// 2) Menu hero: re-encode at native 720p (source is 1280x720 — upscaling to
//    1080p adds ~50% size with zero new detail) with faststart + tight
//    keyframes (0.5s) so scrubbing never stalls waiting for a keyframe.
const menuSrc = path.join(root, "scripts", "media-src", "Hand_navigating_food_delivery_app_202608051224.mp4");
const menuOut = path.join(root, "public", "menu-hero.mp4");
if (fs.existsSync(menuSrc)) {
  run("Optimizing menu hero (menu-hero.mp4, 720p)", [
    "-y",
    "-i",
    menuSrc,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "26",
    "-pix_fmt",
    "yuv420p",
    "-g",
    "15",
    "-keyint_min",
    "15",
    "-movflags",
    "+faststart",
    "-an",
    menuOut,
  ]);
  const size = (fs.statSync(menuOut).size / 1024 / 1024).toFixed(2);
  console.log(`   → ${menuOut} (${size} MB)`);
} else {
  console.warn(`   ! ${menuSrc} not found, skipping`);
}

// 3) Extract a tiny JPEG poster from each encoded video so the hero paints
//    instantly (preload="metadata" never downloads the video body up-front).
//    Even smaller than a video frame grab — ~15-40 KB each.
const heroPosterOut = path.join(root, "public", "hero-food-poster.jpg");
run("Extracting home-hero poster (hero-food-poster.jpg)", [
  "-y",
  "-i",
  heroOut,
  "-frames:v",
  "1",
  "-vf",
  "scale=640:-2",
  "-q:v",
  "5",
  heroPosterOut,
]);

const menuPosterOut = path.join(root, "public", "menu-hero-poster.jpg");
run("Extracting menu-hero poster (menu-hero-poster.jpg)", [
  "-y",
  "-i",
  menuOut,
  "-frames:v",
  "1",
  "-vf",
  "scale=640:-2",
  "-q:v",
  "5",
  menuPosterOut,
]);

console.log("\nDone.");
