import { build } from "esbuild";
import { cp, rm } from "node:fs/promises";
import { glob } from "glob";

await rm("dist", { recursive: true, force: true });

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

await cp("public", "dist", { recursive: true });