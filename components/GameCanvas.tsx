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
  onWaveCompleted?: (waveData: { wave: number; bonus: number; maxGoldPerQuestion: number }) => void;
  onQuizCompleted?: (quizData: { totalGold: number; quizResult?: any; summary?: string }) => void;
  onQuestionAnswered?: (questionData: { 
    questionId: number; 
    isCorrect: boolean; 
    attemptsCount: number; 
    goldEarned: number; 
    nextAttemptGold?: number;
    message: string; 
  }) => void;
}

export default function GameCanvas({ onGameStateChange, onGoldChange, onWaveCompleted, onQuizCompleted, onQuestionAnswered }: GameCanvasProps) {
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

      // Listen for wave completion
      gameScene.events.on('waveCompleted', (waveData: { wave: number; bonus: number; maxGoldPerQuestion: number }) => {
        onWaveCompleted?.(waveData);
      });

      // Listen for quiz completion
      gameScene.events.on('quizCompleted', (quizData: { totalGold: number; quizResult?: any; summary?: string }) => {
        onQuizCompleted?.(quizData);
      });

      // Listen for individual question answers
      gameScene.events.on('questionAnswered', (questionData: { 
        questionId: number; 
        isCorrect: boolean; 
        attemptsCount: number; 
        goldEarned: number; 
        nextAttemptGold?: number;
        message: string; 
      }) => {
        onQuestionAnswered?.(questionData);
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
  }, [addGold, gold, onGameStateChange, onGoldChange, onQuestionAnswered, onQuizCompleted, onWaveCompleted, setGameActive]);

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

  // Expose method to mark quiz as completed with detailed results
  const markQuizCompleted = (quizResult?: any) => {
    if (gameRef.current?.scene.scenes[1]) {
      const gameScene = gameRef.current.scene.scenes[1] as any;
      if (gameScene.markQuizCompleted) {
        gameScene.markQuizCompleted(quizResult);
      }
    }
  };

  // Expose method to submit individual question answers
  const submitQuestionAnswer = (questionId: number, attemptsCount: number, isCorrect: boolean): number => {
    if (gameRef.current?.scene.scenes[1]) {
      const gameScene = gameRef.current.scene.scenes[1] as any;
      if (gameScene.submitQuestionAnswer) {
        return gameScene.submitQuestionAnswer(questionId, attemptsCount, isCorrect);
      }
    }
    return 0;
  };

  // Expose method to get quiz configuration
  const getQuizConfig = () => {
    if (gameRef.current?.scene.scenes[1]) {
      const gameScene = gameRef.current.scene.scenes[1] as any;
      if (gameScene.getQuizConfig) {
        return gameScene.getQuizConfig();
      }
    }
    return null;
  };

  // Expose the game instance and methods for external access
  useEffect(() => {
    (window as any).gameCanvas = {
      markQuizCompleted,
      submitQuestionAnswer,
      getQuizConfig,
      getGameScene: () => gameRef.current?.scene.scenes[1],
    };

    return () => {
      delete (window as any).gameCanvas;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-game-primary"
      style={{
        minHeight: '600px',
        maxHeight: '100vh',
        aspectRatio: '16/10'
      }}
    />
  );
}