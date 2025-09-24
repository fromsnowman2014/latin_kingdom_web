import * as Phaser from 'phaser';
import { GAME_CONFIG, TOWER_COSTS, COLORS, QUIZ_CONFIG } from '../config/GameConfig';
import { TowerSprite } from '../entities/TowerSprite';
import { EnemySprite } from '../entities/EnemySprite';
import { GamePosition, TowerType } from '@/types/game';
import { QuizCalculator, QuizResult, QuestionAttempt } from '../utils/QuizCalculator';

interface LocalGameState {
  gold: number;
  lives: number;
  wave: number;
  score: number;
  gameOver: boolean;
  waveInProgress: boolean;
  waveComplete: boolean;
  selectedTowerType: TowerType;
  selectedTower: TowerSprite | null;
  path: GamePosition[];
  showNextWaveButton: boolean;
  quizCompleted: boolean;
  currentQuizResult: QuizResult | null;
}

export class GameScene extends Phaser.Scene {
  private gameState: LocalGameState;
  private towers: TowerSprite[];
  private enemies: EnemySprite[];
  private path: GamePosition[];
  private gridSize: number = 40;
  private backgroundSurface: Phaser.GameObjects.Graphics | null = null;
  private dragging: boolean = false;
  private dragTowerType: TowerType | null = null;
  private previewTower: Phaser.GameObjects.Graphics | null = null;
  private nextWaveButton: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });

    // Initialize game state
    this.gameState = {
      gold: GAME_CONFIG.STARTING_GOLD,
      lives: GAME_CONFIG.STARTING_LIVES,
      wave: 1,
      score: 0,
      gameOver: false,
      waveInProgress: false,
      waveComplete: false,
      selectedTowerType: 'archer',
      selectedTower: null,
      path: [],
      showNextWaveButton: false,
      quizCompleted: false,
      currentQuizResult: null,
    };

    this.towers = [];
    this.enemies = [];
    this.path = [];
  }

  create() {
    // Create grid background
    this.createGridBackground();

    // Generate random path
    this.path = this.generateRandomPath();
    this.gameState.path = this.path;

    // Draw the path
    this.drawPath();

    // Draw castle at the end of path
    this.drawCastle();

    // Create UI
    this.createUI();

    // Set up input handlers
    this.setupInputHandlers();

    // Start first wave
    this.startWave();
  }

  update() {
    if (this.gameState.gameOver) {
      return;
    }

    // Update towers
    this.towers.forEach(tower => {
      tower.update(this.enemies);
    });

    // Update enemies
    this.enemies.forEach((enemy, index) => {
      const result = enemy.update();
      if (result === 'reached_end') {
        this.gameState.lives--;
        this.enemies.splice(index, 1);
        enemy.destroy();

        if (this.gameState.lives <= 0) {
          this.gameState.gameOver = true;
          this.showGameOver();
        }
      } else if (!enemy.isAlive()) {
        this.gameState.gold += enemy.getReward();
        this.gameState.score += enemy.getReward();
        this.enemies.splice(index, 1);
        enemy.destroy();
      }
    });

    // Check wave completion
    if (this.gameState.waveInProgress && this.enemies.length === 0) {
      this.gameState.waveInProgress = false;
      this.gameState.waveComplete = true;
      this.gameState.gold += GAME_CONFIG.WAVE_COMPLETION_BONUS;
      this.gameState.showNextWaveButton = true;
      this.showNextWaveButton();
      
      // Initialize quiz for this wave
      this.initializeQuizForWave();
      
      // Emit event for vocabulary quiz
      this.events.emit('waveCompleted', {
        wave: this.gameState.wave,
        bonus: GAME_CONFIG.WAVE_COMPLETION_BONUS,
        maxGoldPerQuestion: QUIZ_CONFIG.MAX_GOLD_PER_QUESTION
      });
    }

    // Update UI
    this.updateUI();

    // Emit game state changes for external components
    this.events.emit('gameStateChanged', this.getGameState());
  }

  // Public method to get current game state
  getGameState() {
    return {
      gold: this.gameState.gold,
      lives: this.gameState.lives,
      wave: this.gameState.wave,
      score: this.gameState.score,
      gameOver: this.gameState.gameOver,
      waveInProgress: this.gameState.waveInProgress,
      waveComplete: this.gameState.waveComplete,
      showNextWaveButton: this.gameState.showNextWaveButton,
      quizCompleted: this.gameState.quizCompleted,
    };
  }

  // Public method to update gold from vocabulary learning
  updateGoldFromVocabulary(newGold: number) {
    this.gameState.gold = newGold;
  }

  // Public method to add gold from vocabulary learning
  addGoldFromVocabulary(amount: number) {
    this.gameState.gold += amount;
    this.events.emit('goldFromVocabulary', amount);
  }

  // Public method to mark quiz as completed with detailed results
  markQuizCompleted(quizResult?: QuizResult) {
    this.gameState.quizCompleted = true;
    
    if (quizResult) {
      this.gameState.currentQuizResult = quizResult;
      const totalGold = QuizCalculator.calculateWaveGold(quizResult);
      this.gameState.gold += totalGold;
      
      this.events.emit('quizCompleted', { 
        totalGold,
        quizResult,
        summary: QuizCalculator.getQuizSummary(quizResult)
      });
    } else {
      // Fallback for backward compatibility
      const defaultGold = 100;
      this.gameState.gold += defaultGold;
      this.events.emit('quizCompleted', { totalGold: defaultGold });
    }
  }

  // Public method to start next wave
  startNextWave() {
    if (this.gameState.waveComplete && !this.gameState.waveInProgress) {
      this.hideNextWaveButton();
      this.gameState.wave++;
      this.gameState.waveComplete = false;
      this.gameState.showNextWaveButton = false;
      this.gameState.quizCompleted = false;
      this.gameState.currentQuizResult = null;
      this.startWave();
    }
  }

  // Public method to handle individual question attempts
  submitQuestionAnswer(questionId: number, attemptsCount: number, isCorrect: boolean): number {
    const attempt = QuizCalculator.createQuestionAttempt(questionId, attemptsCount, isCorrect);
    
    if (isCorrect) {
      this.gameState.gold += attempt.goldEarned;
      this.events.emit('questionAnswered', {
        questionId,
        isCorrect: true,
        attemptsCount,
        goldEarned: attempt.goldEarned,
        message: `Correct! +${attempt.goldEarned} gold`
      });
    } else {
      const nextAttemptGold = QuizCalculator.previewQuestionGold(attemptsCount);
      this.events.emit('questionAnswered', {
        questionId,
        isCorrect: false,
        attemptsCount,
        goldEarned: 0,
        nextAttemptGold,
        message: `Wrong answer. Next attempt will earn ${nextAttemptGold} gold.`
      });
    }
    
    return attempt.goldEarned;
  }

  // Public method to get quiz configuration
  getQuizConfig() {
    return {
      maxGoldPerQuestion: QUIZ_CONFIG.MAX_GOLD_PER_QUESTION,
      wrongAnswerPenalty: QUIZ_CONFIG.WRONG_ANSWER_PENALTY,
      perfectWaveMultiplier: QUIZ_CONFIG.PERFECT_WAVE_MULTIPLIER
    };
  }

  // Private method to initialize quiz for current wave
  private initializeQuizForWave() {
    this.gameState.currentQuizResult = {
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      attempts: []
    };
  }

  private createGridBackground() {
    this.backgroundSurface = this.add.graphics();

    // Base background color (dark green grass-like)
    const baseColor = 0x225022;
    this.backgroundSurface.fillStyle(baseColor);
    this.backgroundSurface.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT);

    // Grid line colors
    const lightGridColor = 0x2D5F2D;
    const darkGridColor = 0x194119;

    // Draw horizontal grid lines
    for (let y = 0; y <= GAME_CONFIG.SCREEN_HEIGHT; y += this.gridSize) {
      this.backgroundSurface.lineStyle(1, lightGridColor);
      this.backgroundSurface.beginPath();
      this.backgroundSurface.moveTo(0, y);
      this.backgroundSurface.lineTo(GAME_CONFIG.SCREEN_WIDTH, y);
      this.backgroundSurface.strokePath();
    }

    // Draw vertical grid lines
    for (let x = 0; x <= GAME_CONFIG.SCREEN_WIDTH; x += this.gridSize) {
      this.backgroundSurface.lineStyle(1, lightGridColor);
      this.backgroundSurface.beginPath();
      this.backgroundSurface.moveTo(x, 0);
      this.backgroundSurface.lineTo(x, GAME_CONFIG.SCREEN_HEIGHT);
      this.backgroundSurface.strokePath();
    }
  }

  private generateRandomPath(): GamePosition[] {
    const pathPoints: GamePosition[] = [];

    // Starting position (left side) - snap to grid
    const startX = 60;
    const startYGrid = Phaser.Math.Between(4, 12);
    const startY = startYGrid * this.gridSize + this.gridSize / 2;
    pathPoints.push({ x: startX, y: startY });

    // Generate intermediate points
    let currentX = startX;
    let currentY = startY;

    const numSegments = Phaser.Math.Between(8, 12);
    const segmentWidth = (GAME_CONFIG.SCREEN_WIDTH - 120) / numSegments;

    for (let i = 1; i < numSegments; i++) {
      currentX += segmentWidth;
      currentX = Math.floor(currentX / this.gridSize) * this.gridSize + this.gridSize / 2;

      if (i < numSegments / 2) {
        const verticalChange = Phaser.Math.Between(-2, 2) * this.gridSize;
        currentY += verticalChange;
      } else {
        const targetYGrid = Math.floor((GAME_CONFIG.SCREEN_HEIGHT / 2) / this.gridSize);
        const currentYGrid = Math.floor(currentY / this.gridSize);
        if (currentYGrid > targetYGrid) {
          const verticalChange = Phaser.Math.Between(-2, 0) * this.gridSize;
          currentY += verticalChange;
        } else {
          const verticalChange = Phaser.Math.Between(0, 2) * this.gridSize;
          currentY += verticalChange;
        }
      }

      // Keep within bounds
      const currentYGrid = Math.floor(currentY / this.gridSize);
      const boundedYGrid = Phaser.Math.Clamp(currentYGrid, 3, Math.floor(GAME_CONFIG.SCREEN_HEIGHT / this.gridSize) - 3);
      currentY = boundedYGrid * this.gridSize + this.gridSize / 2;

      pathPoints.push({ x: currentX, y: currentY });
    }

    // Final point (castle position)
    const castleXGrid = Math.floor((GAME_CONFIG.SCREEN_WIDTH - 80) / this.gridSize);
    const castleX = castleXGrid * this.gridSize + this.gridSize / 2;
    const castleY = currentY;

    pathPoints.push({ x: castleX, y: castleY });

    return pathPoints;
  }

  private drawPath() {
    const pathGraphics = this.add.graphics();
    const pathColor = 0x654321; // Brown
    const pathBorderColor = 0x503419; // Darker brown

    for (let i = 0; i < this.path.length - 1; i++) {
      const start = this.path[i];
      const end = this.path[i + 1];

      const startGridX = Math.floor(start.x / this.gridSize);
      const startGridY = Math.floor(start.y / this.gridSize);
      const endGridX = Math.floor(end.x / this.gridSize);
      const endGridY = Math.floor(end.y / this.gridSize);

      // Draw path blocks
      if (startGridX === endGridX) {
        // Vertical segment
        const minY = Math.min(startGridY, endGridY);
        const maxY = Math.max(startGridY, endGridY);
        for (let y = minY; y <= maxY; y++) {
          this.drawPathBlock(pathGraphics, startGridX * this.gridSize, y * this.gridSize, pathColor, pathBorderColor);
        }
      } else if (startGridY === endGridY) {
        // Horizontal segment
        const minX = Math.min(startGridX, endGridX);
        const maxX = Math.max(startGridX, endGridX);
        for (let x = minX; x <= maxX; x++) {
          this.drawPathBlock(pathGraphics, x * this.gridSize, startGridY * this.gridSize, pathColor, pathBorderColor);
        }
      } else {
        // L-shaped segment
        // Horizontal first
        const minX = Math.min(startGridX, endGridX);
        const maxX = Math.max(startGridX, endGridX);
        for (let x = minX; x <= maxX; x++) {
          this.drawPathBlock(pathGraphics, x * this.gridSize, startGridY * this.gridSize, pathColor, pathBorderColor);
        }
        // Then vertical
        const minY = Math.min(startGridY, endGridY);
        const maxY = Math.max(startGridY, endGridY);
        for (let y = minY; y <= maxY; y++) {
          this.drawPathBlock(pathGraphics, endGridX * this.gridSize, y * this.gridSize, pathColor, pathBorderColor);
        }
      }
    }
  }

  private drawPathBlock(graphics: Phaser.GameObjects.Graphics, x: number, y: number, fillColor: number, borderColor: number) {
    graphics.fillStyle(fillColor);
    graphics.fillRect(x, y, this.gridSize, this.gridSize);
    graphics.lineStyle(2, borderColor);
    graphics.strokeRect(x, y, this.gridSize, this.gridSize);
  }

  private drawCastle() {
    const castlePos = this.path[this.path.length - 1];
    const castle = this.add.image(castlePos.x, castlePos.y, 'castle');
    castle.setScale(0.5);
  }

  private createUI() {
    // UI background
    const uiGraphics = this.add.graphics();
    uiGraphics.fillStyle(0x000000);
    uiGraphics.fillRect(0, GAME_CONFIG.SCREEN_HEIGHT - 100, GAME_CONFIG.SCREEN_WIDTH, 100);
    uiGraphics.lineStyle(2, 0xFFFFFF);
    uiGraphics.beginPath();
    uiGraphics.moveTo(0, GAME_CONFIG.SCREEN_HEIGHT - 100);
    uiGraphics.lineTo(GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT - 100);
    uiGraphics.strokePath();

    // Tower buttons
    this.createTowerButtons();

    // Game stats
    this.createGameStats();
  }

  private createTowerButtons() {
    const towers = [
      { name: 'Archer', type: 'archer' as TowerType, cost: TOWER_COSTS.archer },
      { name: 'Magic', type: 'magic' as TowerType, cost: TOWER_COSTS.magic },
      { name: 'Cannon', type: 'cannon' as TowerType, cost: TOWER_COSTS.cannon },
    ];

    towers.forEach((tower, index) => {
      const x = 20 + index * 120;
      const y = GAME_CONFIG.SCREEN_HEIGHT - 80;

      // Button background
      const button = this.add.graphics();
      button.fillStyle(0x808080);
      button.fillRect(x, y, 100, 30);
      button.lineStyle(2, 0xFFFFFF);
      button.strokeRect(x, y, 100, 30);

      // Button text
      const text = this.add.text(x + 5, y + 5, `${tower.name} ($${tower.cost})`, {
        fontSize: '12px',
        color: '#ffffff'
      });

      // Make button interactive
      const buttonZone = this.add.zone(x + 50, y + 15, 100, 30)
        .setInteractive()
        .on('pointerdown', () => {
          if (this.gameState.gold >= tower.cost) {
            this.startTowerDrag(tower.type);
          }
        });
    });
  }

  private createGameStats() {
    // These will be updated in updateUI
    this.add.text(GAME_CONFIG.SCREEN_WIDTH - 200, GAME_CONFIG.SCREEN_HEIGHT - 90, '', {
      fontSize: '16px',
      color: '#ffffff'
    }).setName('goldText');

    this.add.text(GAME_CONFIG.SCREEN_WIDTH - 200, GAME_CONFIG.SCREEN_HEIGHT - 70, '', {
      fontSize: '16px',
      color: '#ffffff'
    }).setName('livesText');

    this.add.text(GAME_CONFIG.SCREEN_WIDTH - 200, GAME_CONFIG.SCREEN_HEIGHT - 50, '', {
      fontSize: '16px',
      color: '#ffffff'
    }).setName('waveText');

    this.add.text(GAME_CONFIG.SCREEN_WIDTH - 200, GAME_CONFIG.SCREEN_HEIGHT - 30, '', {
      fontSize: '16px',
      color: '#ffffff'
    }).setName('scoreText');
  }

  private updateUI() {
    const goldText = this.children.getByName('goldText') as Phaser.GameObjects.Text;
    const livesText = this.children.getByName('livesText') as Phaser.GameObjects.Text;
    const waveText = this.children.getByName('waveText') as Phaser.GameObjects.Text;
    const scoreText = this.children.getByName('scoreText') as Phaser.GameObjects.Text;

    if (goldText) goldText.setText(`Gold: $${this.gameState.gold}`);
    if (livesText) livesText.setText(`Lives: ${this.gameState.lives}`);
    if (waveText) waveText.setText(`Wave: ${this.gameState.wave}`);
    if (scoreText) scoreText.setText(`Score: ${this.gameState.score}`);
  }

  private setupInputHandlers() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) {
        this.handleTowerSelection(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.handleTowerPlacement(pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.updateTowerPreview(pointer.x, pointer.y);
      }
    });
  }

  private startTowerDrag(towerType: TowerType) {
    this.dragging = true;
    this.dragTowerType = towerType;

    // Create preview
    this.previewTower = this.add.graphics();
  }

  private updateTowerPreview(x: number, y: number) {
    if (!this.previewTower) return;

    // Snap to grid
    const gridX = Math.floor(x / this.gridSize) * this.gridSize + this.gridSize / 2;
    const gridY = Math.floor(y / this.gridSize) * this.gridSize + this.gridSize / 2;

    this.previewTower.clear();

    // Check if position is valid
    const isValid = this.canPlaceTower(gridX, gridY);
    const color = isValid ? COLORS.GREEN : COLORS.RED;

    this.previewTower.lineStyle(3, color);
    this.previewTower.strokeCircle(gridX, gridY, 30);
  }

  private handleTowerPlacement(x: number, y: number) {
    if (!this.dragging || !this.dragTowerType) return;

    // Snap to grid
    const gridX = Math.floor(x / this.gridSize) * this.gridSize + this.gridSize / 2;
    const gridY = Math.floor(y / this.gridSize) * this.gridSize + this.gridSize / 2;

    if (this.canPlaceTower(gridX, gridY)) {
      const cost = TOWER_COSTS[this.dragTowerType];
      if (this.gameState.gold >= cost) {
        // Create tower
        const tower = new TowerSprite(this, gridX, gridY, this.dragTowerType);
        this.towers.push(tower);
        this.gameState.gold -= cost;
      }
    }

    // Reset drag state
    this.dragging = false;
    this.dragTowerType = null;
    if (this.previewTower) {
      this.previewTower.destroy();
      this.previewTower = null;
    }
  }

  private handleTowerSelection(x: number, y: number) {
    // Find tower at position
    const tower = this.towers.find(t => {
      const distance = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      return distance < 32;
    });

    this.gameState.selectedTower = tower || null;
  }

  private canPlaceTower(x: number, y: number): boolean {
    // Check if too close to path
    for (const pathPoint of this.path) {
      const distance = Phaser.Math.Distance.Between(x, y, pathPoint.x, pathPoint.y);
      if (distance < 50) {
        return false;
      }
    }

    // Check if too close to other towers
    for (const tower of this.towers) {
      const distance = Phaser.Math.Distance.Between(x, y, tower.x, tower.y);
      if (distance < 50) {
        return false;
      }
    }

    // Check if in UI area
    if (y > GAME_CONFIG.SCREEN_HEIGHT - 100) {
      return false;
    }

    return true;
  }

  private startWave() {
    if (!this.gameState.waveInProgress) {
      this.gameState.waveInProgress = true;
      this.gameState.waveComplete = false;

      // Spawn enemies based on wave
      const enemiesInWave = 5 + this.gameState.wave * 2;

      for (let i = 0; i < enemiesInWave; i++) {
        this.time.delayedCall(i * 1000, () => {
          this.spawnEnemy();
        });
      }
    }
  }

  private spawnEnemy() {
    let enemyType: string;

    if (this.gameState.wave <= 2) {
      enemyType = 'goblin';
    } else if (this.gameState.wave <= 5) {
      enemyType = Phaser.Math.RND.pick(['goblin', 'orc']);
    } else if (this.gameState.wave <= 10) {
      enemyType = Phaser.Math.RND.pick(['goblin', 'orc', 'troll']);
    } else {
      enemyType = Phaser.Math.RND.pick(['goblin', 'orc', 'troll', 'dragon']);
    }

    const enemy = new EnemySprite(this, enemyType, this.path);
    this.enemies.push(enemy);
  }

  private showGameOver() {
    // Create overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT);

    // Game over text
    this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2, GAME_CONFIG.SCREEN_HEIGHT / 2 - 60, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000'
    }).setOrigin(0.5);

    this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2, GAME_CONFIG.SCREEN_HEIGHT / 2, `Final Score: ${this.gameState.score}`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2, GAME_CONFIG.SCREEN_HEIGHT / 2 + 60, 'Click to restart', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Restart on click
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  private showNextWaveButton() {
    if (this.nextWaveButton) {
      this.hideNextWaveButton();
    }

    // Create button container
    this.nextWaveButton = this.add.container(GAME_CONFIG.SCREEN_WIDTH / 2, GAME_CONFIG.SCREEN_HEIGHT / 2);

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4CAF50);
    buttonBg.fillRoundedRect(-100, -30, 200, 60, 10);
    buttonBg.lineStyle(3, 0x388E3C);
    buttonBg.strokeRoundedRect(-100, -30, 200, 60, 10);
    this.nextWaveButton.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, `Next Wave ${this.gameState.wave + 1}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.nextWaveButton.add(buttonText);

    // Subtitle text
    const subtitleText = this.add.text(0, 40, 'Complete vocabulary quiz to earn bonus gold!', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.nextWaveButton.add(subtitleText);

    // Make button interactive
    const buttonZone = this.add.zone(0, 0, 200, 100)
      .setInteractive()
      .on('pointerdown', () => {
        this.startNextWave();
      })
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x66BB6A);
        buttonBg.fillRoundedRect(-100, -30, 200, 60, 10);
        buttonBg.lineStyle(3, 0x388E3C);
        buttonBg.strokeRoundedRect(-100, -30, 200, 60, 10);
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x4CAF50);
        buttonBg.fillRoundedRect(-100, -30, 200, 60, 10);
        buttonBg.lineStyle(3, 0x388E3C);
        buttonBg.strokeRoundedRect(-100, -30, 200, 60, 10);
      });
    
    this.nextWaveButton.add(buttonZone);

    // Add glow effect
    this.tweens.add({
      targets: this.nextWaveButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Power2'
    });
  }

  private hideNextWaveButton() {
    if (this.nextWaveButton) {
      this.nextWaveButton.destroy();
      this.nextWaveButton = null;
    }
  }
}