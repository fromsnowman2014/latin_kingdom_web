'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { PreloadScene } from '@/game/scenes/PreloadScene';
import { GameScene } from '@/game/scenes/GameScene';
import { PHASER_CONFIG } from '@/game/config/GameConfig';
import { useGameStore } from '@/store/gameStore';

interface GameCanvasProps {
  onGameStateChange?: (state: any) => void;
  onGoldChange?: (gold: number) => void;
}

export default function GameCanvas({ onGameStateChange, onGoldChange }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game store
  const { gold, addGold, setGameActive } = useGameStore();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    // Configure Phaser
    const config: Phaser.Types.Core.GameConfig = {
      ...PHASER_CONFIG,
      parent: containerRef.current,
      scene: [PreloadScene, GameScene],
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Set up communication with game scenes
    gameRef.current.events.on('ready', () => {
      setGameActive(true);
    });

    // Listen for game events
    if (gameRef.current.scene.scenes[1]) {
      const gameScene = gameRef.current.scene.scenes[1];

      // Listen for game state changes
      gameScene.events.on('gameStateChanged', (state: any) => {
        onGameStateChange?.(state);
      });

      // Listen for gold changes from vocabulary learning
      gameScene.events.on('goldFromVocabulary', (amount: number) => {
        addGold(amount);
        onGoldChange?.(gold + amount);
      });
    }

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      setGameActive(false);
    };
  }, []);

  // Sync gold changes to Phaser game
  useEffect(() => {
    if (gameRef.current?.scene.scenes[1]) {
      const gameScene = gameRef.current.scene.scenes[1] as any;
      if (gameScene.updateGoldFromVocabulary) {
        gameScene.updateGoldFromVocabulary(gold);
      }
    }
  }, [gold]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.refresh();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Expose game instance for external access
  useEffect(() => {
    if (gameRef.current && onGameStateChange) {
      // Periodically sync game state
      const interval = setInterval(() => {
        if (gameRef.current?.scene.scenes[1]) {
          const gameScene = gameRef.current.scene.scenes[1] as any;
          if (gameScene.getGameState) {
            onGameStateChange(gameScene.getGameState());
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [onGameStateChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-game-primary"
      style={{ minHeight: '700px' }}
    />
  );
}