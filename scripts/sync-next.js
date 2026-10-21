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

    // Ensure NestJS API dist is copied into standalone and .next directories
    const apiDist = path.join(rootDir, 'apps', 'api', 'dist');
    if (fs.existsSync(apiDist)) {
      const standaloneApiDist = path.join(standaloneRoot, 'apps', 'api', 'dist');
      const destApiDist = path.join(destDir, 'apps', 'api', 'dist');
      fs.mkdirSync(standaloneApiDist, { recursive: true });
      fs.cpSync(apiDist, standaloneApiDist, { recursive: true });
      fs.mkdirSync(destApiDist, { recursive: true });
      fs.cpSync(apiDist, destApiDist, { recursive: true });
      console.log(`[sync-next] Copied NestJS API dist into standalone and .next.`);
    }

    // Ensure backend dependencies are present in standalone node_modules
    const rootModules = path.join(rootDir, 'node_modules');
    const standaloneModules = path.join(standaloneRoot, 'node_modules');
    const backendDeps = [
      '@nestjs',
      '@prisma',
      'prisma',
      'bcryptjs',
      'passport',
      'passport-jwt',
      'reflect-metadata',
      'rxjs',
      'class-transformer',
      'class-validator',
      'dotenv',
    ];

    for (const dep of backendDeps) {
      const srcDep = path.join(rootModules, dep);
      const destDep = path.join(standaloneModules, dep);
      if (fs.existsSync(srcDep) && !fs.existsSync(destDep)) {
        try {
          fs.mkdirSync(path.dirname(destDep), { recursive: true });
          fs.cpSync(srcDep, destDep, { recursive: true });
        } catch {}
      }
    }
    console.log(`[sync-next] Synced backend dependencies into standalone node_modules.`);
  }
} catch (err) {
  console.error(`[sync-next] Failed during sync:`, err.message);
}
