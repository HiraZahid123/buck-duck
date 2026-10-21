const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'apps', 'web', '.next');
const destDir = path.join(rootDir, '.next');
const webPublic = path.join(rootDir, 'apps', 'web', 'public');

if (!fs.existsSync(srcDir)) {
  console.warn(`[sync-next] Source directory not found: ${srcDir}`);
  process.exit(0);
}

console.log(`[sync-next] Syncing build output: ${srcDir} -> ${destDir}`);

try {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  // Copy build artifacts to root .next so Hostinger finds the expected output directory
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`[sync-next] Successfully copied .next to repository root.`);

  const standaloneRoot = path.join(destDir, 'standalone');
  const standaloneWeb = path.join(standaloneRoot, 'apps', 'web');

  // If Next.js generated standalone server inside apps/web, ensure top-level standalone server.js exists
  if (fs.existsSync(standaloneWeb)) {
    const topServer = path.join(standaloneRoot, 'server.js');
    if (!fs.existsSync(topServer)) {
      fs.writeFileSync(topServer, "process.chdir(__dirname);\nrequire('./apps/web/server.js');\n", 'utf8');
      console.log(`[sync-next] Created top-level standalone server: ${topServer}`);
    }

    // Next.js standalone requires static assets to be in .next/static and public in standalone
    const staticSrc = path.join(srcDir, 'static');
    if (fs.existsSync(staticSrc)) {
      const topStatic = path.join(standaloneRoot, '.next', 'static');
      const webStatic = path.join(standaloneWeb, '.next', 'static');
      fs.mkdirSync(path.dirname(topStatic), { recursive: true });
      fs.mkdirSync(path.dirname(webStatic), { recursive: true });
      fs.cpSync(staticSrc, topStatic, { recursive: true });
      fs.cpSync(staticSrc, webStatic, { recursive: true });
      console.log(`[sync-next] Copied static chunks into standalone directory.`);
    }

    if (fs.existsSync(webPublic)) {
      const topPublic = path.join(standaloneRoot, 'public');
      const webPub = path.join(standaloneWeb, 'public');
      fs.cpSync(webPublic, topPublic, { recursive: true });
      fs.cpSync(webPublic, webPub, { recursive: true });
      console.log(`[sync-next] Copied public assets into standalone directory.`);
    }
  }
} catch (err) {
  console.error(`[sync-next] Failed during sync:`, err.message);
}
