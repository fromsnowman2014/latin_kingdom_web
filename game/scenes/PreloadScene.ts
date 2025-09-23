import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    this.createLoadingBar();

    // Load images
    this.load.image('background', '/assets/images/background.png');
    this.load.image('castle', '/assets/images/castle.png');

    // Enemy sprites
    this.load.image('goblin', '/assets/images/goblin.png');
    this.load.image('orc', '/assets/images/orc.png');
    this.load.image('troll', '/assets/images/troll.png');
    this.load.image('dragon', '/assets/images/dragon.png');

    // Tower sprites
    this.load.image('archer_tower', '/assets/images/archer_tower.png');
    this.load.image('magic_tower', '/assets/images/magic_tower.png');
    this.load.image('cannon_tower', '/assets/images/cannon_tower.png');

    // Effect sprites
    this.load.image('coin_pickup', '/assets/images/coin_pickup.png');
    this.load.image('portal', '/assets/images/portal.gif');
    this.load.image('explode', '/assets/images/explode.gif');

    // Audio files
    this.load.audio('tower_shoot', '/assets/audio/tower_shoot.mp3');
    this.load.audio('enemy_death', '/assets/audio/enemy_death.mp3');
    this.load.audio('coin_pickup_sound', '/assets/audio/coin_pickup.mp3');

    // Update loading progress
    this.load.on('progress', (progress: number) => {
      this.updateLoadingBar(progress);
    });

    this.load.on('complete', () => {
      this.scene.start('GameScene');
    });
  }

  private createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 60);

    // Title
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 80,
      text: 'Latin Kingdom',
      style: {
        font: '32px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: 'Loading assets...',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);

    // Store references for updating
    this.data.set('progressBar', progressBar);
    this.data.set('assetText', assetText);
  }

  private updateLoadingBar(progress: number) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.data.get('progressBar');

    progressBar.clear();
    progressBar.fillStyle(0x00ff00, 1);
    progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * progress, 40);

    const assetText = this.data.get('assetText');
    assetText.setText(`Loading assets... ${Math.round(progress * 100)}%`);
  }
}