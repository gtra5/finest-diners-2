// One-off production asset optimizer: downscales + re-encodes the big
// imported images in src/assets so they stop shipping at 5-19 MB each.
// Uses the already-installed ffmpeg-static — no new dependencies.
//
//   node scripts/compress-assets.mjs
//
// Rules:
//   - JPEGs (photos): max 1200px wide, decent quality (q:v 4). These are
//     displayed at 260-360px in polaroids/cards, so 1200px covers retina.
//   - PNGs (decorative produce, backgrounds): max 900px, high compression.
//   - Files already small are skipped.
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "src", "assets");

if (!ffmpegPath) {
  console.error("ffmpeg-static not found. Run: npm i -D ffmpeg-static");
  process.exit(1);
}

// name -> { maxWidth, skipIfKbBelow, kind }
const TARGETS = {
  "advertisment.jpg": { maxWidth: 1200, skipIfKbBelow: 300, kind: "jpg" },
  "front-view-smiley-man-holding-pizza.jpg": { maxWidth: 1200, skipIfKbBelow: 300, kind: "jpg" },
  "medium-shot-smiley-man-eating-bistro.jpg": { maxWidth: 1200, skipIfKbBelow: 300, kind: "jpg" },
  "delicious-burger-with-fresh-ingredients.jpg": { maxWidth: 1000, skipIfKbBelow: 300, kind: "jpg" },
  "salad (3).png": { maxWidth: 900, skipIfKbBelow: 400, kind: "png" },
  "tomatotes.png": { maxWidth: 900, skipIfKbBelow: 300, kind: "png" },
  "pepper.png": { maxWidth: 900, skipIfKbBelow: 300, kind: "png" },
  "pizza (2).png": { maxWidth: 900, skipIfKbBelow: 300, kind: "png" },
  "bugers.png": { maxWidth: 900, skipIfKbBelow: 300, kind: "png" },
  "bg-heritage.png": { maxWidth: 1200, skipIfKbBelow: 400, kind: "png" },
  "bg-community.png": { maxWidth: 1200, skipIfKbBelow: 400, kind: "png" },
  "bg-machines.png": { maxWidth: 1200, skipIfKbBelow: 400, kind: "png" },
  "bg-creative.png": { maxWidth: 1200, skipIfKbBelow: 400, kind: "png" },
  "bg-burger.png": { maxWidth: 1200, skipIfKbBelow: 400, kind: "png" },
};

let saved = 0;
for (const [name, cfg] of Object.entries(TARGETS)) {
  const file = path.join(assetsDir, name);
  if (!fs.existsSync(file)) {
    console.warn(`  ! missing: ${name}`);
    continue;
  }
  const before = fs.statSync(file).size;
  if (before / 1024 < cfg.skipIfKbBelow) {
    console.log(`  = ${name}: already small (${(before / 1024).toFixed(1)} KB), skipping`);
    continue;
  }

  const tmp = path.join(assetsDir, `.tmp-${name}`);
  const filter = `scale='min(${cfg.maxWidth},iw)':-2`;
  const args = cfg.kind === "jpg"
    ? ["-y", "-i", file, "-vf", filter, "-q:v", "4", "-pix_fmt", "yuvj420p", tmp]
    : ["-y", "-i", file, "-vf", filter, "-compression_level", "9", "-pred", "mixed", tmp];

  try {
    execFileSync(ffmpegPath, args, { stdio: "ignore" });
    const after = fs.statSync(tmp).size;
    if (after < before) {
      fs.renameSync(tmp, file);
      const pct = (100 - (after / before) * 100).toFixed(1);
      console.log(`  ✓ ${name}: ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB (-${pct}%)`);
      saved += before - after;
    } else {
      fs.unlinkSync(tmp);
      console.log(`  = ${name}: re-encode no smaller, keeping original`);
    }
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message.split("\n")[0]}`);
  }
}
console.log(`\nTotal saved: ${(saved / 1024 / 1024).toFixed(2)} MB`);
