// Game Types based on Python game analysis and PRD requirements

export interface GameConstants {
  SCREEN_WIDTH: number;
  SCREEN_HEIGHT: number;
  FPS: number;
  STARTING_GOLD: number;
  STARTING_LIVES: number;
  WAVE_COMPLETION_BONUS: number;
  ENEMY_SPAWN_DELAY: number;
}

export interface TowerCosts {
  archer: number;
  magic: number;
  cannon: number;
}

export type TowerType = 'archer' | 'magic' | 'cannon';
export type EnemyType = 'goblin' | 'orc' | 'troll' | 'dragon';

export interface TowerConfig {
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  projectileSpeed: number;
  projectileColor: string;
}

export interface EnemyConfig {
  maxHealth: number;
  speed: number;
  reward: number;
  size: number;
}

export interface GamePosition {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  x: number;
  y: number;
  towerType: TowerType;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastShot: number;
  cost: number;
}

export interface Enemy {
  id: string;
  enemyType: EnemyType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  pathIndex: number;
  alive: boolean;
  targetX: number;
  targetY: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  towerType: TowerType;
  active: boolean;
}

export interface GameState {
  gold: number;
  lives: number;
  wave: number;
  score: number;
  gameOver: boolean;
  waveInProgress: boolean;
  waveComplete: boolean;
  selectedTowerType: TowerType;
  selectedTower: Tower | null;
  path: GamePosition[];
}

// Latin Learning System Types
export interface Vocabulary {
  id: string;
  assignment_id: string;
  english_meaning: string;
  latin_word: string;
  difficulty: number;
  word_length: number;
  hints: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  difficulty_level: number;
  total_words: number;
  vocabularies?: Vocabulary[];
}

export interface WordValidationResult {
  is_correct: boolean;
  correct_word: string;
  hint_level: number;
  gold_reward: number;
  current_hint?: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  assignment_id: string;
  start_time: string;
  end_time?: string;
  status: 'playing' | 'completed' | 'failed';
  final_score?: number;
  words_learned: number;
  accuracy_rate?: number;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  vocabulary_id: string;
  attempts: number;
  correct_answers: number;
  last_answered?: string;
  mastery_level: number;
}

// UI Component Types
export interface VocabularyPanelProps {
  vocabularies: Vocabulary[];
  currentWord?: string;
  onWordComplete: (word: string, isCorrect: boolean) => void;
}

export interface WordInputProps {
  currentMeaning: string;
  onSubmit: (input: string) => void;
  hint?: string;
  disabled?: boolean;
}

export interface GameStats {
  gold: number;
  lives: number;
  wave: number;
  score: number;
  wordsLearned: number;
  accuracy: number;
}