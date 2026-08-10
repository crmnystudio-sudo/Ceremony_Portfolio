import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function handler(req, res) {
  const { file } = req.query;

  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Missing file parameter' });
  }

  // Decode and sanitize filename
  const decodedFile = decodeURIComponent(file);
  if (decodedFile.includes('..') || decodedFile.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const videoPath = path.join(__dirname, '..', 'Assets', 'videos', decodedFile);

  try {
    const content = fs.readFileSync(videoPath, 'utf-8').trim();

    // Check if it's an LFS pointer
    if (content.includes('version https://git-lfs.github.com/spec/v1')) {
      const oidMatch = content.match(/oid sha256:(\w+)/);
      if (!oidMatch) {
        return res.status(500).json({ error: 'Invalid LFS pointer' });
      }

      const oid = oidMatch[1];
      const lfsUrl = `https://github.com/crmnystudio-sudo/Ceremony_Portfolio.git/info/lfs/objects/${oid}`;

      // Redirect to LFS storage
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.redirect(302, lfsUrl);
    }

    // If not LFS pointer, serve directly
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(content);
  } catch (err) {
    console.error(`Error serving ${decodedFile}:`, err.message);
    res.status(500).json({ error: 'File not found' });
  }
}
