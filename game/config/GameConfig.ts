// Game Configuration - Ported from Python constants.py
import { GameConstants, TowerCosts, TowerConfig, EnemyConfig } from '@/types/game';

export const GAME_CONFIG: GameConstants = {
  SCREEN_WIDTH: 1000,
  SCREEN_HEIGHT: 700,
  FPS: 60,
  STARTING_GOLD: 200,
  STARTING_LIVES: 20,
  WAVE_COMPLETION_BONUS: 50,
  ENEMY_SPAWN_DELAY: 1000, // milliseconds
};

export const TOWER_COSTS: TowerCosts = {
  archer: 50,
  magic: 100,
  cannon: 150,
};

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  archer: {
    damage: 15,
    range: 80,
    fireRate: 1000,
    cost: TOWER_COSTS.archer,
    projectileSpeed: 8,
    projectileColor: '#FFFF00', // Yellow
  },
  magic: {
    damage: 25,
    range: 70,
    fireRate: 1500,
    cost: TOWER_COSTS.magic,
    projectileSpeed: 10,
    projectileColor: '#800080', // Purple
  },
  cannon: {
    damage: 40,
    range: 100,
    fireRate: 2000,
    cost: TOWER_COSTS.cannon,
    projectileSpeed: 6,
    projectileColor: '#000000', // Black
  },
};

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  goblin: {
    maxHealth: 50,
    speed: 0.5,
    reward: 10,
    size: 15,
  },
  orc: {
    maxHealth: 100,
    speed: 0.2,
    reward: 20,
    size: 20,
  },
  troll: {
    maxHealth: 200,
    speed: 0.2,
    reward: 40,
    size: 25,
  },
  dragon: {
    maxHealth: 500,
    speed: 0.6,
    reward: 100,
    size: 30,
  },
};

export const COLORS = {
  WHITE: 0xFFFFFF,
  BLACK: 0x000000,
  GREEN: 0x00FF00,
  RED: 0xFF0000,
  BLUE: 0x0000FF,
  DARK_BLUE: 0x000080,
  YELLOW: 0xFFFF00,
  BROWN: 0x8B4513,
  GRAY: 0x808080,
  DARK_GREEN: 0x006400,
  PURPLE: 0x800080,
  ORANGE: 0xFFA500,
};

export const PHASER_CONFIG = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.SCREEN_WIDTH,
  height: GAME_CONFIG.SCREEN_HEIGHT,
  backgroundColor: '#225533',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};