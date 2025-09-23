import { create } from 'zustand';
import { Assignment, Vocabulary, WordValidationResult, GameStats } from '@/types/game';

interface GameStore {
  // Game state
  gold: number;
  lives: number;
  wave: number;
  score: number;
  wordsLearned: number;
  accuracy: number;
  gameActive: boolean;

  // Current assignment
  currentAssignment: Assignment | null;
  vocabularies: Vocabulary[];

  // Learning state
  currentWordIndex: number;
  learnedWordIds: Set<string>;
  totalAttempts: number;
  correctAttempts: number;

  // UI state
  showHints: boolean;
  gameSessionId: string | null;

  // Actions
  setGold: (gold: number) => void;
  addGold: (amount: number) => void;
  setLives: (lives: number) => void;
  setWave: (wave: number) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;

  setCurrentAssignment: (assignment: Assignment) => void;
  setVocabularies: (vocabularies: Vocabulary[]) => void;

  setCurrentWordIndex: (index: number) => void;
  markWordLearned: (vocabularyId: string) => void;
  recordAttempt: (isCorrect: boolean) => void;

  setGameActive: (active: boolean) => void;
  setShowHints: (show: boolean) => void;
  setGameSessionId: (sessionId: string) => void;

  // Computed values
  getGameStats: () => GameStats;
  getAccuracy: () => number;
  getWordsLearnedCount: () => number;

  // Reset functions
  resetGame: () => void;
  resetLearning: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gold: 200,
  lives: 20,
  wave: 1,
  score: 0,
  wordsLearned: 0,
  accuracy: 0,
  gameActive: false,

  currentAssignment: null,
  vocabularies: [],

  currentWordIndex: 0,
  learnedWordIds: new Set(),
  totalAttempts: 0,
  correctAttempts: 0,

  showHints: true,
  gameSessionId: null,

  // Actions
  setGold: (gold) => set({ gold }),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  setLives: (lives) => set({ lives }),
  setWave: (wave) => set({ wave }),
  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),

  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setVocabularies: (vocabularies) => set({ vocabularies }),

  setCurrentWordIndex: (index) => set({ currentWordIndex: index }),
  markWordLearned: (vocabularyId) =>
    set((state) => ({
      learnedWordIds: new Set([...state.learnedWordIds, vocabularyId]),
    })),
  recordAttempt: (isCorrect) =>
    set((state) => ({
      totalAttempts: state.totalAttempts + 1,
      correctAttempts: state.correctAttempts + (isCorrect ? 1 : 0),
    })),

  setGameActive: (active) => set({ gameActive: active }),
  setShowHints: (show) => set({ showHints: show }),
  setGameSessionId: (sessionId) => set({ gameSessionId: sessionId }),

  // Computed values
  getGameStats: () => {
    const state = get();
    return {
      gold: state.gold,
      lives: state.lives,
      wave: state.wave,
      score: state.score,
      wordsLearned: state.learnedWordIds.size,
      accuracy: state.getAccuracy(),
    };
  },

  getAccuracy: () => {
    const state = get();
    if (state.totalAttempts === 0) return 0;
    return Math.round((state.correctAttempts / state.totalAttempts) * 100);
  },

  getWordsLearnedCount: () => {
    const state = get();
    return state.learnedWordIds.size;
  },

  // Reset functions
  resetGame: () =>
    set({
      gold: 200,
      lives: 20,
      wave: 1,
      score: 0,
      gameActive: false,
    }),

  resetLearning: () =>
    set({
      currentWordIndex: 0,
      learnedWordIds: new Set(),
      totalAttempts: 0,
      correctAttempts: 0,
    }),
}));

// Hook for game statistics
export const useGameStats = () => {
  const store = useGameStore();
  return {
    stats: store.getGameStats(),
    accuracy: store.getAccuracy(),
    wordsLearned: store.getWordsLearnedCount(),
  };
};