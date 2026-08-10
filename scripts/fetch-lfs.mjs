import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Function to read and parse LFS pointer file
function parseLFSPointer(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('version https://git-lfs.github.com/spec/v1')) {
      return null;
    }

    const oidMatch = content.match(/oid sha256:(\w+)/);
    const sizeMatch = content.match(/size (\d+)/);

    if (!oidMatch) return null;

    return {
      oid: oidMatch[1],
      size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
      isPointer: true
    };
  } catch (e) {
    return null;
  }
}

// Function to download file from GitHub's LFS CDN
function downloadFromGitHub(oid, outputPath) {
  return new Promise((resolve, reject) => {
    const url = `https://github.com/crmnystudio-sudo/Ceremony_Portfolio/raw/main/Assets/videos/.gitattributes`;

    // Try direct raw GitHub URL for LFS objects
    const lfsUrl = `https://objects.githubusercontent.com/github-production-repository-file-service-baa216c8/4fa0dded-6f28-4e83-b937-e4d1e0d87dc0`;

    console.log(`Downloading ${path.basename(outputPath)}...`);

    https.get(`https://github.com/crmnystudio-sudo/Ceremony_Portfolio/raw/main/${outputPath.replace(projectRoot, '').replace(/\\/g, '/')}`,
      {
        redirect: 'follow',
        maxRedirects: 5
      },
      (res) => {
        if (res.statusCode === 404) {
          console.log(`⚠️ File not found: ${outputPath}`);
          resolve();
          return;
        }
        if (res.statusCode !== 200) {
          console.error(`HTTP ${res.statusCode}`);
          resolve(); // Don't reject, continue
          return;
        }

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const file = fs.createWriteStream(outputPath);
        res.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(outputPath)}`);
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // Delete incomplete file
          console.error(`Error downloading: ${err.message}`);
          resolve(); // Don't reject, continue
        });
      }
    ).on('error', (err) => {
      console.error(`Download error: ${err.message}`);
      resolve(); // Don't reject, continue
    });
  });
}

// Main function
async function fetchLFSFiles() {
  const videosDir = path.join(projectRoot, 'Assets', 'videos');

  if (!fs.existsSync(videosDir)) {
    console.log('Videos directory not found');
    return;
  }

  const files = fs.readdirSync(videosDir);
  let count = 0;

  for (const file of files) {
    if (!file.match(/\.(mp4|webm|mov)$/i)) continue;

    const filePath = path.join(videosDir, file);
    const pointer = parseLFSPointer(filePath);

    if (pointer) {
      count++;
      await downloadFromGitHub(pointer.oid, filePath);
    }
  }

  console.log(`\n✓ LFS fetch complete (processed ${count} video files)`);
}

fetchLFSFiles().catch(console.error);
