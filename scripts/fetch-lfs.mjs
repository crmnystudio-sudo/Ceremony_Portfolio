import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('🎬 LFS File Fetcher Started');
console.log(`Project root: ${projectRoot}`);

// Parse LFS pointer and extract OID
function parseLFSPointer(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content.includes('version https://git-lfs.github.com/spec/v1')) {
      return null; // Not an LFS pointer
    }
    const oidMatch = content.match(/oid sha256:(\w+)/);
    if (!oidMatch) return null;
    return { oid: oidMatch[1], isPointer: true };
  } catch (e) {
    return null;
  }
}

// Download file using fetch-based approach
async function downloadFile(url, outputPath) {
  return new Promise((resolve) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`  Fetching: ${path.basename(outputPath)} from ${url.split('/').pop()}`);

    const file = fs.createWriteStream(outputPath);

    https.get(url, { maxRedirects: 10 }, (res) => {
      if (res.statusCode === 404) {
        console.log(`  ⚠️  Not found: ${path.basename(outputPath)}`);
        resolve(false);
        return;
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        console.log(`  ⚠️  HTTP ${res.statusCode}`);
        resolve(false);
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  ✓ Downloaded: ${path.basename(outputPath)}`);
        resolve(true);
      });
      file.on('error', () => {
        fs.unlink(outputPath, () => {});
        resolve(false);
      });
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Main execution
async function main() {
  const videosDir = path.join(projectRoot, 'Assets', 'videos');

  if (!fs.existsSync(videosDir)) {
    console.log('❌ Videos directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(videosDir);
  let pointerCount = 0;
  let downloadCount = 0;

  for (const file of files) {
    if (!file.match(/\.(mp4|webm|mov)$/i)) continue;

    const filePath = path.join(videosDir, file);
    const pointer = parseLFSPointer(filePath);

    if (!pointer) continue;

    pointerCount++;
    console.log(`\n[${pointerCount}] Processing: ${file}`);

    // Try multiple download sources
    const sources = [
      `https://github.com/crmnystudio-sudo/Ceremony_Portfolio/raw/main/Assets/videos/${encodeURIComponent(file)}`,
      `https://raw.githubusercontent.com/crmnystudio-sudo/Ceremony_Portfolio/main/Assets/videos/${encodeURIComponent(file)}`,
    ];

    let downloaded = false;
    for (const url of sources) {
      if (await downloadFile(url, filePath)) {
        downloadCount++;
        downloaded = true;
        break;
      }
    }

    if (!downloaded) {
      console.log(`  ⚠️  Failed to download ${file} from all sources`);
    }
  }

  console.log(`\n✓ Complete: ${downloadCount}/${pointerCount} files downloaded`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
