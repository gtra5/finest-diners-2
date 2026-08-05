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
const framesDir = path.join(root, "src", "assets", "foodframes");
const framesGlob = path.join(framesDir, "ezgif-frame-%03d.jpg");
const heroOut = path.join(root, "public", "hero-food.mp4");
if (fs.existsSync(framesDir)) {
  run("Encoding home hero (hero-food.mp4, all-intra for smooth scrubbing)", [
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

// 2) Menu hero: re-encode with faststart + tight keyframes (0.5s) so scrubbing
//    never stalls waiting for a keyframe, capped at 1280px wide.
const menuSrc = path.join(root, "public", "Hand_navigating_food_delivery_app_202608051224.mp4");
const menuOut = path.join(root, "public", "menu-hero.mp4");
if (fs.existsSync(menuSrc)) {
  run("Optimizing menu hero (menu-hero.mp4)", [
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
    "-vf",
    "scale='min(1280,iw)':-2",
    menuOut,
  ]);
  const size = (fs.statSync(menuOut).size / 1024 / 1024).toFixed(2);
  console.log(`   → ${menuOut} (${size} MB)`);
} else {
  console.warn(`   ! ${menuSrc} not found, skipping`);
}

console.log("\nDone.");
