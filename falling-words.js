// Falling words physics animation
class FallingWordsAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.ripples = [];
    this.wordList = [];
    this.wordIndex = 0;

    this.gravity = 0.03;
    this.friction = 0.94;
    this.bounce = 0.01;
    this.spawnInterval = 1500;
    this.lastSpawnTime = 0;
    this.animationStartTime = 0;
    this.wordLifetime = 30000; // 30 seconds lifetime per word before fade

    this.fontSize = 16;
    this.fontFamily = '16px Palatino Linotype, serif';

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

    if (now - this.lastSpawnTime < this.spawnInterval) return;
    this.lastSpawnTime = now;

    const word = this.getRandomWord();
    if (!word) return;

    const dims = this.measureText(word);
    const centerX = this.canvas.width / 2;
    const x = centerX + (Math.random() - 0.5) * 80;
    const y = -this.canvas.height - 200; // Start falling from well above the header
    const vx = (Math.random() - 0.5) * 0.2;
    const vy = 0;
    const rotation = 0;
    const rotationVelocity = (Math.random() - 0.5) * 0.012;
    const spawnTime = now;

    this.particles.push({
      word,
      x,
      y,
      vx,
      vy,
      rotation,
      rotationVelocity,
      ...dims,
      landed: false,
      spawnTime
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
    // Circular collision detection - radius is average of width/height
    const r1 = Math.max(p1.width, p1.height) / 2;
    const r2 = Math.max(p2.width, p2.height) / 2;
    const minDist = r1 + r2;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < minDist;
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
        p.rotationVelocity *= 0.99;
      }

      const bottom = this.canvas.height - p.height - 20;
      if (p.y > bottom) {
        p.y = bottom;
        p.vy *= -this.bounce;

        if (!p.landed) {
          p.landTime = Date.now();
        }
        p.landed = true;
      }

      // Natural water movement after landing
      if (p.landed) {
        const timeSinceLanding = Date.now() - (p.landTime || Date.now());

        // Gentle bobbing motion - subtle vertical oscillation
        const bobAmount = Math.sin(timeSinceLanding * 0.003) * 0.5;
        p.y += bobAmount * 0.1;

        // Gradual horizontal drift based on position (like floating currents)
        if (p.x < centerX) {
          p.vx += -0.005; // Gentle leftward push
        } else {
          p.vx += 0.005; // Gentle rightward push
        }

        // Add tiny random drift (water currents)
        p.vx += (Math.random() - 0.5) * 0.002;
      }

      // Smooth water flow - gentle push away from edges
      const leftEdge = p.width / 2;
      const rightEdge = this.canvas.width - p.width / 2;
      const edgeBuffer = 40;

      // Left edge - gentle push right
      if (p.x < leftEdge + edgeBuffer) {
        const distFromEdge = p.x - leftEdge;
        const pushForce = (1 - Math.max(0, distFromEdge) / edgeBuffer) * 0.02;
        p.vx += pushForce;
      }

      // Right edge - gentle push left
      if (p.x > rightEdge - edgeBuffer) {
        const distFromEdge = rightEdge - p.x;
        const pushForce = (1 - Math.max(0, distFromEdge) / edgeBuffer) * 0.02;
        p.vx -= pushForce;
      }

      // Clamp position to stay within bounds
      if (p.x < leftEdge) p.x = leftEdge;
      if (p.x > rightEdge) p.x = rightEdge;

      // Stop when at rest
      if (Math.abs(p.vy) < 0.05 && Math.abs(p.vx) < 0.05 && p.landed) {
        p.vy = 0;
        p.vx = 0;
      }
    });

    // Minimal circular collision separation - allow overlapping
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        if (this.checkBounds(this.particles[i], this.particles[j])) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const r1 = Math.max(p1.width, p1.height) / 2;
          const r2 = Math.max(p2.width, p2.height) / 2;
          const minDist = r1 + r2;

          if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const moveX = nx * overlap * 0.05;
            const moveY = ny * overlap * 0.05;

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

    const now = Date.now();

    // Draw words
    this.ctx.font = this.fontFamily;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.particles.forEach(p => {
      // Calculate lifetime and opacity
      const age = now - p.spawnTime;
      const fadeStartTime = this.wordLifetime * 0.6; // Start fading at 60% of lifetime
      let opacity = 1;
      let colorProgress = 0;

      if (age > fadeStartTime) {
        const fadeTime = this.wordLifetime - fadeStartTime;
        const fadeProgress = (age - fadeStartTime) / fadeTime;
        opacity = Math.max(0, 1 - fadeProgress);
        colorProgress = fadeProgress;
      }

      // Transition from dark ink to light blue as it fades
      const startR = 26, startG = 26, startB = 26;
      const endR = 180, endG = 200, endB = 220;
      const r = Math.round(startR + (endR - startR) * colorProgress);
      const g = Math.round(startG + (endG - startG) * colorProgress);
      const b = Math.round(startB + (endB - startB) * colorProgress);

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;

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

    // Remove dead and off-screen particles
    this.particles = this.particles.filter(p => {
      const age = now - p.spawnTime;
      return age < this.wordLifetime && p.y < this.canvas.height + 100;
    });
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
