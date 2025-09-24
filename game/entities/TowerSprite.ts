import * as Phaser from 'phaser';
import { TowerType } from '@/types/game';
import { TOWER_CONFIGS } from '../config/GameConfig';
import { EnemySprite } from './EnemySprite';
import { ProjectileSprite } from './ProjectileSprite';

export class TowerSprite extends Phaser.GameObjects.Container {
  private towerType: TowerType;
  private level: number = 1;
  private damage: number;
  private range: number;
  private fireRate: number;
  private lastShot: number = 0;
  private cost: number;
  private projectiles: ProjectileSprite[] = [];
  private towerSprite: Phaser.GameObjects.Image;
  private rangeCircle: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, towerType: TowerType) {
    super(scene, x, y);

    this.towerType = towerType;
    const config = TOWER_CONFIGS[towerType];

    this.damage = config.damage;
    this.range = config.range;
    this.fireRate = config.fireRate;
    this.cost = config.cost;

    // Create tower sprite
    this.towerSprite = scene.add.image(0, 0, `${towerType}_tower`);
    this.towerSprite.setScale(0.2); // Scale down to fit grid
    this.add(this.towerSprite);

    scene.add.existing(this);
  }

  update(enemies: EnemySprite[]) {
    const currentTime = this.scene.time.now;

    // Update projectiles
    this.projectiles.forEach((projectile, index) => {
      projectile.update();

      if (!projectile.active || projectile.hasHit()) {
        projectile.destroy();
        this.projectiles.splice(index, 1);
      }
    });

    // Find and shoot at enemies
    const target = this.findTarget(enemies);
    if (target && this.canShoot(currentTime)) {
      this.shoot(target, currentTime);
    }
  }

  private findTarget(enemies: EnemySprite[]): EnemySprite | null {
    let closestEnemy: EnemySprite | null = null;
    let closestDistance = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance <= this.range && distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  private canShoot(currentTime: number): boolean {
    return currentTime - this.lastShot >= this.fireRate;
  }

  private shoot(target: EnemySprite, currentTime: number) {
    // Play shooting sound
    this.scene.sound.play('tower_shoot', { volume: 0.3 });

    // Create projectile
    const projectile = new ProjectileSprite(
      this.scene,
      this.x,
      this.y,
      target,
      this.damage,
      this.towerType
    );

    this.projectiles.push(projectile);
    this.lastShot = currentTime;
  }

  upgrade() {
    if (this.level < 3) {
      this.level++;
      this.damage = Math.floor(this.damage * 1.5);
      this.range = Math.floor(this.range * 1.1);

      // Update visual indicator (optional level display)
      this.updateLevelDisplay();

      return this.cost * this.level;
    }
    return 0;
  }

  private updateLevelDisplay() {
    // Remove existing level text if any
    const existingText = this.list.find(child => child.name === 'levelText');
    if (existingText) {
      this.remove(existingText, true);
    }

    if (this.level > 1) {
      const levelText = this.scene.add.text(25, -25, this.level.toString(), {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      });
      levelText.setName('levelText');
      this.add(levelText);
    }
  }

  showRange() {
    if (!this.rangeCircle) {
      this.rangeCircle = this.scene.add.graphics();
      this.rangeCircle.lineStyle(2, 0xffffff, 0.5);
      this.rangeCircle.strokeCircle(this.x, this.y, this.range);
    }
  }

  hideRange() {
    if (this.rangeCircle) {
      this.rangeCircle.destroy();
      this.rangeCircle = null;
    }
  }

  getTowerType(): TowerType {
    return this.towerType;
  }

  getLevel(): number {
    return this.level;
  }

  getCost(): number {
    return this.cost;
  }

  getRange(): number {
    return this.range;
  }

  getDamage(): number {
    return this.damage;
  }
}