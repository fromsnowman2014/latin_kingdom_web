import * as Phaser from 'phaser';
import { GamePosition } from '@/types/game';
import { ENEMY_CONFIGS } from '../config/GameConfig';

export class EnemySprite extends Phaser.GameObjects.Container {
  private enemyType: string;
  private path: GamePosition[];
  private pathIndex: number = 0;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private reward: number;
  private alive: boolean = true;
  private targetX: number;
  private targetY: number;
  private enemySprite: Phaser.GameObjects.Image;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, enemyType: string, path: GamePosition[]) {
    super(scene, path[0].x, path[0].y);

    this.enemyType = enemyType;
    this.path = path;

    const config = ENEMY_CONFIGS[enemyType];
    this.health = config.maxHealth;
    this.maxHealth = config.maxHealth;
    this.speed = config.speed;
    this.reward = config.reward;

    // Set initial target
    if (path.length > 1) {
      this.targetX = path[1].x;
      this.targetY = path[1].y;
      this.pathIndex = 1;
    } else {
      this.targetX = path[0].x;
      this.targetY = path[0].y;
    }

    // Create enemy sprite
    this.enemySprite = scene.add.image(0, 0, enemyType);
    this.enemySprite.setScale(0.03); // Scale down to 1/10 size
    this.add(this.enemySprite);

    // Create health bar background
    this.healthBarBg = scene.add.graphics();
    this.healthBarBg.fillStyle(0xff0000);
    this.healthBarBg.fillRect(-20, -30, 40, 4);
    this.add(this.healthBarBg);

    // Create health bar
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    this.add(this.healthBar);

    scene.add.existing(this);
  }

  update(): string | null {
    if (!this.alive) {
      return null;
    }

    // Move towards target point
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Reached target point
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.alive = false;
        return 'reached_end';
      } else {
        this.targetX = this.path[this.pathIndex].x;
        this.targetY = this.path[this.pathIndex].y;
      }
    } else {
      // Orthogonal movement - prioritize larger displacement
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      // Use a threshold to determine if movement should be purely horizontal or vertical
      const threshold = 2; // Small threshold to handle floating point precision
      
      if (absDx > threshold && absDy > threshold) {
        // If both displacements are significant, move in the direction of larger displacement
        if (absDx >= absDy) {
          // Move horizontally
          this.x += dx > 0 ? this.speed : -this.speed;
        } else {
          // Move vertically
          this.y += dy > 0 ? this.speed : -this.speed;
        }
      } else if (absDx > threshold) {
        // Only horizontal movement needed
        this.x += dx > 0 ? this.speed : -this.speed;
      } else if (absDy > threshold) {
        // Only vertical movement needed
        this.y += dy > 0 ? this.speed : -this.speed;
      } else {
        // Very close to target, use normal movement to avoid getting stuck
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }

    return null;
  }

  takeDamage(damage: number): boolean {
    this.health -= damage;
    this.updateHealthBar();

    if (this.health <= 0) {
      this.alive = false;
      this.playDeathEffect();
      return true; // Enemy died
    }
    return false; // Enemy still alive
  }

  private updateHealthBar() {
    this.healthBar.clear();
    const healthRatio = Math.max(0, this.health / this.maxHealth);
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(-20, -30, 40 * healthRatio, 4);
  }

  private playDeathEffect() {
    // Play death sound
    this.scene.sound.play('enemy_death', { volume: 0.5 });

    // Create death animation (fade out)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  isAlive(): boolean {
    return this.alive;
  }

  getReward(): number {
    return this.reward;
  }

  getEnemyType(): string {
    return this.enemyType;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }
}