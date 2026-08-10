// Falling words physics animation
class FallingWordsAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.wordList = [];
    this.wordIndex = 0;

    this.gravity = 0.06;
    this.friction = 0.90;
    this.bounce = 0.02;
    this.spawnInterval = 1000;
    this.lastSpawnTime = 0;
    this.animationStartTime = 0;
    this.spawnDuration = 15000; // 15 seconds
    this.isSpawning = true;

    this.fontSize = 16;
    this.fontFamily = 'bold 16px Palatino Linotype, serif';

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
      this.wordList = lines.slice(1).map(l => l.trim()).filter(l => l.length > 0);

      if (this.wordList.length > 0) {
        this.animationStartTime = Date.now();
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

  measureText(text) {
    this.ctx.font = this.fontFamily;
    const metrics = this.ctx.measureText(text);
    return {
      width: metrics.width + 4,
      height: this.fontSize + 4
    };
  }

  spawnWord() {
    const now = Date.now();
    const elapsed = now - this.animationStartTime;

    // Check if spawn period is over
    if (elapsed > this.spawnDuration) {
      if (this.isSpawning) {
        this.isSpawning = false;
        // Wait for particles to settle
        setTimeout(() => this.reset(), 2000);
      }
      return;
    }

    if (now - this.lastSpawnTime < this.spawnInterval) return;
    this.lastSpawnTime = now;

    const word = this.getRandomWord();
    if (!word) return;

    const dims = this.measureText(word);
    const centerX = this.canvas.width / 2;
    const x = centerX + (Math.random() - 0.5) * 120;
    const y = -dims.height;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = 0;
    const rotation = 0;
    const rotationVelocity = (Math.random() - 0.5) * 0.03;

    this.particles.push({
      word,
      x,
      y,
      vx,
      vy,
      rotation,
      rotationVelocity,
      ...dims,
      landed: false
    });
  }

  reset() {
    this.particles = [];
    this.wordIndex = 0;
    this.isSpawning = true;
    this.animationStartTime = Date.now();
    this.lastSpawnTime = 0;
  }

  checkBounds(p1, p2) {
    const left1 = p1.x - p1.width / 2;
    const right1 = p1.x + p1.width / 2;
    const top1 = p1.y - p1.height / 2;
    const bottom1 = p1.y + p1.height / 2;

    const left2 = p2.x - p2.width / 2;
    const right2 = p2.x + p2.width / 2;
    const top2 = p2.y - p2.height / 2;
    const bottom2 = p2.y + p2.height / 2;

    return !(right1 < left2 || right2 < left1 || bottom1 < top2 || bottom2 < top1);
  }

  updatePhysics() {
    const centerX = this.canvas.width / 2;
    const hillRadius = 180;

    this.particles.forEach(p => {
      p.vy += this.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= this.friction;
      p.rotation += p.rotationVelocity;
      if (p.landed) {
        p.rotationVelocity *= 0.97;
      }

      const bottom = this.canvas.height - p.height / 2 - 10;
      if (p.y > bottom) {
        p.y = bottom;
        p.vy *= -this.bounce;
        p.landed = true;

        // Gentle push toward center to form hill
        const distFromCenter = Math.abs(p.x - centerX);
        if (distFromCenter > 20) {
          const pushDir = p.x > centerX ? -1 : 1;
          p.vx += pushDir * 0.05;
        }
      }

      // Soft boundaries with safe margins
      const leftBound = p.width / 2 + 20;
      const rightBound = this.canvas.width - p.width / 2 - 20;

      if (p.x < leftBound) {
        p.x = leftBound;
        p.vx *= -0.3;
      }
      if (p.x > rightBound) {
        p.x = rightBound;
        p.vx *= -0.3;
      }

      // Stop when at rest
      if (Math.abs(p.vy) < 0.05 && Math.abs(p.vx) < 0.05 && p.landed) {
        p.vy = 0;
        p.vx = 0;
      }
    });

    // Simple collision separation - just push apart
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        if (this.checkBounds(this.particles[i], this.particles[j])) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (p1.width + p2.width) / 2 + 2;

          if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const moveX = (nx * overlap) / 2;
            const moveY = (ny * overlap) / 2;

            p1.x -= moveX;
            p1.y -= moveY;
            p2.x += moveX;
            p2.y += moveY;
          }
        }
      }
    }
  }

  draw() {
    // Clear canvas completely
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = this.fontFamily;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#1a1a1a';

    this.particles.forEach(p => {
      if (Math.abs(p.rotation) > 0.001) {
        // Save context, translate, rotate, draw, restore
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.fillText(p.word, 0, 0);
        this.ctx.restore();
      } else {
        this.ctx.fillText(p.word, p.x, p.y);
      }
    });

    // Remove off-screen particles
    this.particles = this.particles.filter(p => p.y < this.canvas.height + 100);
  }

  animate = () => {
    this.spawnWord();
    this.updatePhysics();
    this.draw();
    requestAnimationFrame(this.animate);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FallingWordsAnimation('falling-words-canvas');
  });
} else {
  new FallingWordsAnimation('falling-words-canvas');
}
