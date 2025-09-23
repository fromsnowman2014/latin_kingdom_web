import * as Phaser from 'phaser';

export class ExplosionEffect extends Phaser.GameObjects.Container {
  private explosionGraphics: Phaser.GameObjects.Graphics[];
  private particles: Phaser.GameObjects.Graphics[];

  constructor(scene: Phaser.Scene, x: number, y: number, size: number = 30) {
    super(scene, x, y);

    this.explosionGraphics = [];
    this.particles = [];

    this.createExplosion(size);
    scene.add.existing(this);

    // Auto-destroy after animation
    scene.time.delayedCall(600, () => {
      this.destroy();
    });
  }

  private createExplosion(size: number) {
    // Create multiple explosion rings
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      const delay = i * 100;
      const finalSize = size + (i * 15);

      this.scene.time.delayedCall(delay, () => {
        this.animateRing(ring, finalSize);
      });

      this.explosionGraphics.push(ring);
      this.add(ring);
    }

    // Create particles
    this.createParticles();
  }

  private animateRing(ring: Phaser.GameObjects.Graphics, finalSize: number) {
    const colors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00];
    let currentSize = 5;
    let colorIndex = 0;

    const ringAnimation = this.scene.time.addEvent({
      delay: 50,
      repeat: 8,
      callback: () => {
        ring.clear();
        ring.lineStyle(4, colors[colorIndex % colors.length], 0.8);
        ring.strokeCircle(0, 0, currentSize);

        currentSize += finalSize / 8;
        colorIndex++;

        if (colorIndex >= 8) {
          ring.clear();
        }
      }
    });
  }

  private createParticles() {
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const particle = this.scene.add.graphics();

      // Random particle properties
      const speed = Phaser.Math.Between(30, 60);
      const size = Phaser.Math.Between(2, 5);
      const color = Phaser.Math.RND.pick([0xff4500, 0xff6600, 0xffaa00, 0xffffff]);

      particle.fillStyle(color);
      particle.fillCircle(0, 0, size);
      this.add(particle);

      // Animate particle
      const endX = Math.cos(angle) * speed;
      const endY = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });

      this.particles.push(particle);
    }
  }

  destroy() {
    // Clean up all graphics
    this.explosionGraphics.forEach(graphic => {
      if (graphic && graphic.scene) {
        graphic.destroy();
      }
    });

    this.particles.forEach(particle => {
      if (particle && particle.scene) {
        particle.destroy();
      }
    });

    super.destroy();
  }
}