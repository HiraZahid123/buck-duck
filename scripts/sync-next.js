const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'apps', 'web', '.next');
const destDir = path.resolve(__dirname, '..', '.next');

if (!fs.existsSync(srcDir)) {
  console.warn(`[sync-next] Source directory not found: ${srcDir}`);
  process.exit(0);
}

console.log(`[sync-next] Syncing build output: ${srcDir} -> ${destDir}`);

try {
  // If destination already exists, remove it cleanly
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  // Copy build artifacts to root .next so Hostinger finds the expected output directory
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`[sync-next] Successfully copied .next to repository root.`);
} catch (err) {
  console.error(`[sync-next] Failed to copy .next:`, err.message);
  // Do not crash the build if copy fails
}
