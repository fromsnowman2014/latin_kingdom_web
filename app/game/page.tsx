'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Assignment, WordValidationResult } from '@/types/game';
import { useGameStore, useGameStats } from '@/store/gameStore';
import { getAssignments } from '@/lib/vocabulary';
import VocabularyPanel from '@/components/VocabularyPanel';

// Dynamically import GameCanvas to avoid SSR issues with Phaser
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-game-primary">
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

  const handleGameStateChange = (state: any) => {
    setGameState(state);
  };

  const handleGoldEarned = (amount: number) => {
    addGold(amount);
  };

  const handleWordLearned = (vocabularyId: string) => {
    markWordLearned(vocabularyId);
  };

  const handleValidationResult = (result: WordValidationResult) => {
    recordAttempt(result.is_correct);

    if (result.is_correct) {
      // Add visual feedback for correct answer
      console.log(`Correct! Earned ${result.gold_reward} gold`);
    } else {
      // Add visual feedback for incorrect answer
      console.log(`Incorrect. ${result.current_hint ? `Hint: ${result.current_hint}` : 'Try again!'}`);
    }
  };

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

  return (
    <div className="h-screen bg-game-primary">
      <div className="grid grid-cols-1 lg:grid-cols-game-layout h-full">
        {/* Game Canvas */}
        <div className="relative">
          <GameCanvas
            onGameStateChange={handleGameStateChange}
            onGoldChange={(gold) => console.log('Gold changed:', gold)}
          />
        </div>

        {/* Latin Learning Panel */}
        <div className="bg-gray-900 text-white p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-game font-bold text-game-accent mb-2">
              {currentAssignment.title}
            </h2>
            <p className="text-sm text-gray-300">{currentAssignment.description}</p>
          </div>

          {/* Vocabulary Learning Component */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-game-accent">Learn Vocabulary</h3>
            <VocabularyPanel
              vocabularies={currentAssignment.vocabularies || []}
              assignmentId={currentAssignment.id}
              onGoldEarned={handleGoldEarned}
              onWordLearned={handleWordLearned}
              onValidationResult={handleValidationResult}
            />
          </div>

          {/* Game Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-game-accent">Game Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-game-accent font-bold text-lg">{stats.gold}</div>
                <div className="text-gray-400 text-sm">Gold</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-game-danger font-bold text-lg">{gameState?.lives || stats.lives}</div>
                <div className="text-gray-400 text-sm">Lives</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-game-success font-bold text-lg">{gameState?.wave || stats.wave}</div>
                <div className="text-gray-400 text-sm">Wave</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-white font-bold text-lg">{gameState?.score || stats.score}</div>
                <div className="text-gray-400 text-sm">Score</div>
              </div>
            </div>
          </div>

          {/* Learning Progress */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-game-accent">Learning Progress</h3>
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Words Learned</span>
                  <span>{stats.wordsLearned}/{currentAssignment.vocabularies?.length || 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-game-accent h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((stats.wordsLearned) / (currentAssignment.vocabularies?.length || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Accuracy</span>
                  <span>{stats.accuracy}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.accuracy}%` }}
                  />
                </div>
              </div>

              {gameState?.gameOver && (
                <div className="bg-red-800 bg-opacity-50 border border-red-600 text-red-200 p-3 rounded-lg text-center">
                  <div className="font-bold">Game Over!</div>
                  <div className="text-sm mt-1">
                    Final Score: {gameState.score} | Words Learned: {stats.wordsLearned}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}