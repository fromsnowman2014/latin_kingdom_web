import * as Phaser from 'phaser';
import { TowerType } from '@/types/game';
import { TOWER_CONFIGS } from '../config/GameConfig';
import { EnemySprite } from './EnemySprite';
import { ExplosionEffect } from './ExplosionEffect';

export class ProjectileSprite extends Phaser.GameObjects.Container {
  private targetEnemy: EnemySprite;
  private damage: number;
  private speed: number;
  private towerType: TowerType;
  public active: boolean = true;
  private hasHitTarget: boolean = false;
  private projectileGraphics!: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: EnemySprite,
    damage: number,
    towerType: TowerType
  ) {
    super(scene, x, y);

    this.targetEnemy = target;
    this.damage = damage;
    this.towerType = towerType;
    this.speed = TOWER_CONFIGS[towerType].projectileSpeed;

    // Create projectile visual
    this.createProjectileVisual();

    scene.add.existing(this);
  }

  private createProjectileVisual() {
    this.projectileGraphics = this.scene.add.graphics();

    switch (this.towerType) {
      case 'archer':
        // Arrow - yellow line
        this.projectileGraphics.lineStyle(2, 0xffff00);
        this.projectileGraphics.beginPath();
        this.projectileGraphics.moveTo(-6, 0);
        this.projectileGraphics.lineTo(6, 0);
        this.projectileGraphics.strokePath();
        // Arrow head
        this.projectileGraphics.fillStyle(0xffff00);
        this.projectileGraphics.fillTriangle(6, 0, 3, -2, 3, 2);
        break;

      case 'magic':
        // Magic bolt - purple circle with sparkles
        this.projectileGraphics.fillStyle(0x800080);
        this.projectileGraphics.fillCircle(0, 0, 4);
        this.projectileGraphics.lineStyle(1, 0xff00ff);
        this.projectileGraphics.strokeCircle(0, 0, 6);
        break;

      case 'cannon':
        // Cannonball - black circle
        this.projectileGraphics.fillStyle(0x000000);
        this.projectileGraphics.fillCircle(0, 0, 6);
        this.projectileGraphics.lineStyle(1, 0x333333);
        this.projectileGraphics.strokeCircle(0, 0, 6);
        break;
    }

    this.add(this.projectileGraphics);
  }

  update() {
    if (!this.active || this.hasHitTarget) {
      return;
    }

    // Check if target is still alive
    if (!this.targetEnemy.isAlive()) {
      this.active = false;
      return;
    }

    // Move towards target
    const dx = this.targetEnemy.x - this.x;
    const dy = this.targetEnemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      // Hit the target
      this.hitTarget();
    } else {
      // Move towards target
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;

      // Rotate projectile to face movement direction (for arrows)
      if (this.towerType === 'archer') {
        this.rotation = Math.atan2(dy, dx);
      }
    }
  }

  private hitTarget() {
    this.hasHitTarget = true;
    this.active = false;

    // Deal damage to target
    const enemyDied = this.targetEnemy.takeDamage(this.damage);

    // Create hit effect
    this.createHitEffect();

    // For cannon towers, create explosion effect
    if (this.towerType === 'cannon') {
      const explosion = new ExplosionEffect(this.scene, this.x, this.y, 40);
      // Explosion damage to nearby enemies (area effect)
      this.dealAreaDamage();
    }
  }

  private createHitEffect() {
    let effectColor: number;

    switch (this.towerType) {
      case 'archer':
        effectColor = 0xffff00;
        break;
      case 'magic':
        effectColor = 0x800080;
        break;
      case 'cannon':
        effectColor = 0xff4500;
        break;
    }

    // Create simple impact effect
    const effect = this.scene.add.graphics();
    effect.fillStyle(effectColor, 0.8);
    effect.fillCircle(this.x, this.y, 8);

    this.scene.tweens.add({
      targets: effect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        effect.destroy();
      }
    });
  }

  private dealAreaDamage() {
    // Only cannon projectiles have area damage
    if (this.towerType !== 'cannon') return;

    const areaRadius = 40;
    const areaDamage = Math.floor(this.damage * 0.5); // Half damage for area effect

    // Get all enemy sprites in the scene
    const gameScene = this.scene as any; // Type assertion to access enemies
    if (gameScene.enemies) {
      gameScene.enemies.forEach((enemy: EnemySprite) => {
        if (enemy.isAlive() && enemy !== this.targetEnemy) {
          const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          if (distance <= areaRadius) {
            enemy.takeDamage(areaDamage);
          }
        }
      });
    }
  }

  hasHit(): boolean {
    return this.hasHitTarget;
  }

  getTowerType(): TowerType {
    return this.towerType;
  }

  getDamage(): number {
    return this.damage;
  }
}