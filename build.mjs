import { build } from "esbuild";
import { cp, rm } from "node:fs/promises";
import { glob } from "glob";

// Clean output
await rm("dist", { recursive: true, force: true });

// 1. Bundle TypeScript pages
const entryPoints = await glob("src/page/**/index.ts");

await build({
  entryPoints,
  outdir: "dist/page",
  outbase: "src/page",
  bundle: true,
  format: "esm",
  platform: "browser",
  sourcemap: true
});

await build({
    entryPoints: ["src/js/global.ts"],
    outdir: "dist/js",
    bundle: true,
    format: "esm",
    platform: "browser",
    sourcemap: true
})

// 2. Copy static HTML (and any CSS/images)
await cp("public", "dist", { recursive: true });