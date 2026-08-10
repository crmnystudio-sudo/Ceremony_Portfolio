// Falling words physics animation
class FallingWordsAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.words = [];
    this.particles = [];
    this.wordList = [];
    this.wordIndex = 0;

    this.gravity = 0.3;
    this.friction = 0.98;
    this.bounce = 0.4;
    this.minSpawnInterval = 800; // ms between word spawns
    this.lastSpawnTime = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.loadWords();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  async loadWords() {
    try {
      const response = await fetch('data/words.csv?t=' + Date.now());
      const csv = await response.text();
      const lines = csv.trim().split('\n');

      // Skip header, get all words
      this.wordList = lines.slice(1)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (this.wordList.length > 0) {
        this.animate();
      }
    } catch (err) {
      console.error('Error loading words:', err);
    }
  }

  getRandomWord() {
    if (this.wordList.length === 0) return '';
    const word = this.wordList[this.wordIndex];
    this.wordIndex = (this.wordIndex + 1) % this.wordList.length;
    return word;
  }

  spawnWord() {
    const now = Date.now();
    if (now - this.lastSpawnTime < this.minSpawnInterval) return;
    this.lastSpawnTime = now;

    const word = this.getRandomWord();
    if (!word) return;

    const x = this.canvas.width / 2 + (Math.random() - 0.5) * 100;
    const y = -30;
    const vx = (Math.random() - 0.5) * 2;
    const vy = 0;

    this.particles.push({
      word,
      x,
      y,
      vx,
      vy,
      width: 0,
      height: 20,
      landed: false
    });
  }

  updatePhysics() {
    this.particles.forEach((p, i) => {
      // Apply gravity
      p.vy += this.gravity;

      // Apply velocity
      p.x += p.vx;
      p.y += p.vy;

      // Friction in air
      p.vx *= this.friction;

      // Bounce off floor
      if (p.y + p.height > this.canvas.height - 10) {
        p.y = this.canvas.height - 10 - p.height;
        p.vy *= -this.bounce;
        p.landed = true;
      }

      // Bounce off walls
      if (p.x < 0) {
        p.x = 0;
        p.vx *= -0.5;
      }
      if (p.x + p.width > this.canvas.width) {
        p.x = this.canvas.width - p.width;
        p.vx *= -0.5;
      }

      // Stop moving when almost at rest
      if (Math.abs(p.vy) < 0.1 && p.landed) {
        p.vy = 0;
      }
    });

    // Simple collision detection between particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.width + p2.width;

        if (dist < minDist) {
          // Simple collision response
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // Separate particles
          const overlap = minDist - dist + 2;
          p1.x -= overlap * cos * 0.5;
          p1.y -= overlap * sin * 0.5;
          p2.x += overlap * cos * 0.5;
          p2.y += overlap * sin * 0.5;

          // Exchange velocities
          const vx1 = p1.vx * cos + p1.vy * sin;
          const vy1 = p1.vy * cos - p1.vx * sin;
          const vx2 = p2.vx * cos + p2.vy * sin;
          const vy2 = p2.vy * cos - p2.vx * sin;

          p1.vx = vx2 * cos - vy1 * sin;
          p1.vy = vy1 * cos + vx2 * sin;
          p2.vx = vx1 * cos - vy2 * sin;
          p2.vy = vy2 * cos + vx1 * sin;
        }
      }
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.ctx.font = 'bold 14px Palatino Linotype, serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#1a1a1a';

    this.particles.forEach(p => {
      // Measure text width
      const metrics = this.ctx.measureText(p.word);
      p.width = metrics.width + 8;

      // Draw background
      this.ctx.fillStyle = 'rgba(216, 212, 206, 0.8)';
      this.ctx.fillRect(
        p.x - p.width / 2,
        p.y - p.height / 2,
        p.width,
        p.height
      );

      // Draw text
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillText(p.word, p.x, p.y);
    });

    // Cleanup old particles that have fallen too far
    this.particles = this.particles.filter(p => p.y < this.canvas.height + 100);
  }

  animate = () => {
    this.spawnWord();
    this.updatePhysics();
    this.draw();
    requestAnimationFrame(this.animate);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FallingWordsAnimation('falling-words-canvas');
  });
} else {
  new FallingWordsAnimation('falling-words-canvas');
}
