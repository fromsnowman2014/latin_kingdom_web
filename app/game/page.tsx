'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Assignment, WordValidationResult } from '@/types/game';
import { useGameStore, useGameStats } from '@/store/gameStore';
import { getAssignments } from '@/lib/vocabulary';
import VocabularyPanel from '@/components/VocabularyPanel';

// Dynamically import GameCanvas to avoid SSR issues with Phaser
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-game-primary">
      <div className="text-white text-xl">Loading Latin Kingdom...</div>
    </div>
  ),
});

// Mock data for development
const mockAssignment: Assignment = {
  id: '1',
  title: '6th Grade Defender Week 1',
  description: 'Basic Latin vocabulary for beginners',
  difficulty_level: 1,
  total_words: 10,
  vocabularies: [
    {
      id: '1',
      assignment_id: '1',
      english_meaning: 'water',
      latin_word: 'aqua',
      difficulty: 1,
      word_length: 4,
      hints: ['a', 'aq', 'aqu'],
    },
    {
      id: '2',
      assignment_id: '1',
      english_meaning: 'fire',
      latin_word: 'ignis',
      difficulty: 2,
      word_length: 5,
      hints: ['i', 'ig', 'ign', 'igni'],
    },
    {
      id: '3',
      assignment_id: '1',
      english_meaning: 'earth',
      latin_word: 'terra',
      difficulty: 1,
      word_length: 5,
      hints: ['t', 'te', 'ter', 'terr'],
    },
    {
      id: '4',
      assignment_id: '1',
      english_meaning: 'air',
      latin_word: 'aer',
      difficulty: 1,
      word_length: 3,
      hints: ['a', 'ae'],
    },
    {
      id: '5',
      assignment_id: '1',
      english_meaning: 'light',
      latin_word: 'lux',
      difficulty: 1,
      word_length: 3,
      hints: ['l', 'lu'],
    },
  ],
};

export default function GamePage() {
  // Game store
  const {
    setCurrentAssignment,
    setVocabularies,
    markWordLearned,
    recordAttempt,
    addGold
  } = useGameStore();

  const { stats } = useGameStats();

  // Local state
  const [gameState, setGameState] = useState<any>(null);
  const [currentAssignment, setCurrentAssignmentLocal] = useState<Assignment>(mockAssignment);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTower, setSelectedTower] = useState<'archer' | 'magic' | 'cannon' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Tower configurations based on PRD
  const towers = {
    archer: { name: 'Archer', cost: 50, emoji: '🏹', description: 'Fast, low damage' },
    magic: { name: 'Magic', cost: 100, emoji: '🔮', description: 'Piercing attacks' },
    cannon: { name: 'Cannon', cost: 150, emoji: '💣', description: 'High damage, slow' }
  };

  // Load assignments on mount
  useEffect(() => {
    async function loadAssignments() {
      try {
        setIsLoading(true);
        // Try to load from Supabase, fallback to mock data
        try {
          const assignments = await getAssignments();
          if (assignments.length > 0) {
            const assignment = assignments[0];
            setCurrentAssignmentLocal(assignment);
            setCurrentAssignment(assignment);
            setVocabularies(assignment.vocabularies || []);
          } else {
            // Use mock data
            setCurrentAssignment(mockAssignment);
            setVocabularies(mockAssignment.vocabularies || []);
          }
        } catch (supabaseError) {
          console.warn('Using mock data due to Supabase error:', supabaseError);
          // Use mock data as fallback
          setCurrentAssignment(mockAssignment);
          setVocabularies(mockAssignment.vocabularies || []);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
        setError('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    }

    loadAssignments();
  }, [setCurrentAssignment, setVocabularies]);

  const handleGameStateChange = useCallback((state: any) => {
    setGameState(state);
  }, []);

  const handleGoldEarned = useCallback((amount: number) => {
    addGold(amount);
  }, [addGold]);

  const handleWordLearned = useCallback((vocabularyId: string) => {
    markWordLearned(vocabularyId);
  }, [markWordLearned]);

  const handleValidationResult = useCallback((result: WordValidationResult) => {
    recordAttempt(result.is_correct);

    if (result.is_correct) {
      // Add visual feedback for correct answer
      console.log(`Correct! Earned ${result.gold_reward} gold`);
    } else {
      // Add visual feedback for incorrect answer
      console.log(`Incorrect. ${result.current_hint ? `Hint: ${result.current_hint}` : 'Try again!'}`);
    }
  }, [recordAttempt]);

  const handleWaveCompleted = useCallback((waveData: any) => {
    console.log('Wave completed:', waveData);
  }, []);

  const handleQuizCompleted = useCallback((quizData: any) => {
    console.log('Quiz completed:', quizData);
  }, []);

  const handleQuestionAnswered = useCallback((questionData: any) => {
    console.log('Question answered:', questionData);
  }, []);

  const handleTowerSelect = (towerType: 'archer' | 'magic' | 'cannon') => {
    const tower = towers[towerType];
    if (stats.gold >= tower.cost) {
      setSelectedTower(towerType === selectedTower ? null : towerType);
    }
  };

  // Send tower selection to GameCanvas
  useEffect(() => {
    if ((window as any).gameCanvas) {
      (window as any).gameCanvas.setSelectedTowerType?.(selectedTower);
    }
  }, [selectedTower]);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-game-primary flex items-center justify-center">
        <div className="text-white text-xl">Loading Latin Kingdom...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-game-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error loading game</div>
          <div className="text-gray-300">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-game-accent text-gray-900 px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = Math.round((stats.wordsLearned / (currentAssignment.vocabularies?.length || 1)) * 100);

  return (
    <div className="h-screen bg-game-primary">
      {/* PRD-compliant 4-area grid layout */}
      <div
        className="h-full grid"
        style={{
          gridTemplateRows: isMobile
            ? '60px 1fr 1fr 80px'  // Mobile: header, game, quiz, controls
            : '80px 1fr 100px',    // Desktop: header, main, controls
          gridTemplateColumns: isMobile
            ? '1fr'               // Mobile: single column
            : '2fr 1fr',          // Desktop: game + quiz
          gridTemplateAreas: isMobile
            ? `
              "header"
              "game"
              "quiz"
              "controls"
            `
            : `
              "header header"
              "game quiz"
              "towers status"
            `
        }}
      >
        {/* Header Area - 과제명, 진행도, 점수 */}
        <div
          className="bg-gray-800 border-b border-gray-600 flex items-center justify-between px-6"
          style={{ gridArea: 'header' }}
        >
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-game font-bold text-game-accent">
              {currentAssignment.title}
            </h1>
            <span className="text-sm text-gray-300">
              {currentAssignment.description}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Progress Bar */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300">Progress:</span>
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-game-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm text-white">{progressPercentage}%</span>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-white font-bold text-lg">{gameState?.score || stats.score}</div>
              <div className="text-gray-400 text-xs">Score</div>
            </div>
          </div>
        </div>

        {/* Game Canvas Area */}
        <div
          className="relative bg-game-primary"
          style={{ gridArea: 'game' }}
        >
          <GameCanvas
            onGameStateChange={handleGameStateChange}
            onGoldChange={handleGoldEarned}
            onWaveCompleted={handleWaveCompleted}
            onQuizCompleted={handleQuizCompleted}
            onQuestionAnswered={handleQuestionAnswered}
          />
        </div>

        {/* Quiz Panel Area - 단어 리스트 + 입력창 */}
        <div
          className="bg-gray-900 text-white border-l border-gray-600 flex flex-col p-4"
          style={{ gridArea: 'quiz' }}
        >
          <h3 className="text-lg font-semibold mb-4 text-game-accent">Latin Vocabulary Quiz</h3>
          <div className="flex-1 overflow-y-auto">
            <VocabularyPanel
              vocabularies={currentAssignment.vocabularies || []}
              assignmentId={currentAssignment.id}
              onGoldEarned={handleGoldEarned}
              onWordLearned={handleWordLearned}
              onValidationResult={handleValidationResult}
            />
          </div>
        </div>

        {/* Tower Selection UI Area - Desktop Only */}
        <div
          className="bg-gray-800 border-t border-r border-gray-600 flex items-center justify-between p-4"
          style={{
            gridArea: isMobile ? 'none' : 'towers',
            display: isMobile ? 'none' : 'flex'
          }}
        >
          <div className="flex space-x-2">
            {/* Tower Selection Buttons */}
            {(Object.keys(towers) as Array<keyof typeof towers>).map((towerType) => {
              const tower = towers[towerType];
              const canAfford = stats.gold >= tower.cost;
              const isSelected = selectedTower === towerType;

              return (
                <button
                  key={towerType}
                  onClick={() => handleTowerSelect(towerType)}
                  disabled={!canAfford}
                  className={`px-3 py-2 rounded border text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-game-accent text-gray-900 border-game-accent shadow-lg'
                      : canAfford
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500'
                      : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{tower.emoji}</span>
                    <span className="text-xs font-medium">{tower.name}</span>
                    <span className="text-xs opacity-75">${tower.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tower Info */}
          <div className="text-sm text-gray-300">
            {selectedTower ? (
              <div className="text-center">
                <div className="text-game-accent font-medium">
                  {towers[selectedTower].name} Selected
                </div>
                <div className="text-xs">
                  {towers[selectedTower].description}
                </div>
                <div className="text-xs mt-1 text-blue-300">
                  Click on map to place tower
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div>Select a tower to build</div>
                <div className="text-xs opacity-75">
                  Gold: {stats.gold}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Information Area - Desktop Only */}
        <div
          className="bg-gray-800 border-t border-gray-600 flex items-center justify-between px-4"
          style={{
            gridArea: isMobile ? 'none' : 'status',
            display: isMobile ? 'none' : 'flex'
          }}
        >
          <div className="grid grid-cols-4 gap-4 flex-1">
            <div className="bg-gray-700 p-2 rounded text-center">
              <div className="text-game-accent font-bold text-lg">{stats.gold}</div>
              <div className="text-gray-400 text-xs">Gold</div>
            </div>
            <div className="bg-gray-700 p-2 rounded text-center">
              <div className="text-game-danger font-bold text-lg">{gameState?.lives || stats.lives}</div>
              <div className="text-gray-400 text-xs">Lives</div>
            </div>
            <div className="bg-gray-700 p-2 rounded text-center">
              <div className="text-game-success font-bold text-lg">{gameState?.wave || stats.wave}</div>
              <div className="text-gray-400 text-xs">Wave</div>
            </div>
            <div className="bg-gray-700 p-2 rounded text-center">
              <div className="text-white font-bold text-lg">{stats.accuracy}%</div>
              <div className="text-gray-400 text-xs">Accuracy</div>
            </div>
          </div>

          {/* Game Over Message */}
          {gameState?.gameOver && (
            <div className="ml-4 bg-red-800 bg-opacity-50 border border-red-600 text-red-200 px-4 py-2 rounded">
              <div className="font-bold">Game Over!</div>
              <div className="text-xs">Words Learned: {stats.wordsLearned}</div>
            </div>
          )}
        </div>

        {/* Mobile Controls Area - Combined towers and status */}
        <div
          className="bg-gray-800 border-t border-gray-600 p-3"
          style={{
            gridArea: isMobile ? 'controls' : 'none',
            display: isMobile ? 'block' : 'none'
          }}
        >
          {/* Mobile Stats Row */}
          <div className="flex justify-center space-x-4 mb-3">
            <div className="bg-gray-700 px-3 py-1 rounded text-center min-w-0">
              <div className="text-game-accent font-bold text-sm">{stats.gold}</div>
              <div className="text-gray-400 text-xs">Gold</div>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded text-center min-w-0">
              <div className="text-game-danger font-bold text-sm">{gameState?.lives || stats.lives}</div>
              <div className="text-gray-400 text-xs">Lives</div>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded text-center min-w-0">
              <div className="text-game-success font-bold text-sm">{gameState?.wave || stats.wave}</div>
              <div className="text-gray-400 text-xs">Wave</div>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded text-center min-w-0">
              <div className="text-white font-bold text-sm">{stats.accuracy}%</div>
              <div className="text-gray-400 text-xs">Accuracy</div>
            </div>
          </div>

          {/* Mobile Tower Selection */}
          <div className="flex justify-center space-x-2">
            {(Object.keys(towers) as Array<keyof typeof towers>).map((towerType) => {
              const tower = towers[towerType];
              const canAfford = stats.gold >= tower.cost;
              const isSelected = selectedTower === towerType;

              return (
                <button
                  key={towerType}
                  onClick={() => handleTowerSelect(towerType)}
                  disabled={!canAfford}
                  className={`flex-1 px-2 py-1 rounded border text-xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-game-accent text-gray-900 border-game-accent shadow-lg'
                      : canAfford
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                      : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-base">{tower.emoji}</span>
                    <span className="text-xs font-medium">{tower.name}</span>
                    <span className="text-xs opacity-75">${tower.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile Tower Info */}
          {selectedTower && (
            <div className="text-center text-xs text-blue-300 mt-2">
              {towers[selectedTower].name}: {towers[selectedTower].description}
              <br />Tap on game area to place tower
            </div>
          )}
        </div>
      </div>
    </div>
  );
}