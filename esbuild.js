// Bundles src/extension.ts (+ its whole dependency graph, including moment/rrule/chrono-node)
// into a single dist/extension.js. This is what actually fixes vsce's "you should bundle your
// extension" warning — see the "Bundling con esbuild" section of CLAUDE.md for why trimming
// .vscodeignore alone wasn't enough (vsce warns once packaged JS files > 100; chrono-node's
// index.js alone pulls in ~227 per-locale files that can't be excluded without breaking it).
//
// Usage: node esbuild.js [--production] [--watch]
const esbuild = require('esbuild');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Clean dist/ before every build. Without this, switching between a dev build (with
// sourcemap) and a --production build (without one) leaves the previous run's
// dist/extension.js.map lying around — esbuild only writes outputs it's asked for, it
// never deletes stale ones from a prior invocation. vsce then happily packages that
// leftover .map into the .vsix (reported: a "clean" production package that was
// ~1 MB heavier than expected and shipped a debug sourcemap, because `npm run compile`
// had been run right before `npm run package` without anything in between clearing dist/).
fs.rmSync('dist', { recursive: true, force: true });

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'ES2020',
    outfile: 'dist/extension.js',
    external: ['vscode'], // provided by the extension host at runtime, never bundled
    minify: production,
    sourcemap: !production,
    sourcesContent: !production,
    logLevel: 'info',
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
