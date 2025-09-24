import { supabase } from './supabase';
import { Assignment, Vocabulary, WordValidationResult, GameSession, LearningProgress } from '@/types/game';

// Get assignments with their vocabularies
export async function getAssignments(): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        vocabularies (*)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    throw error;
  }
}

// Get specific assignment with vocabularies
export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        vocabularies (*)
      `)
      .eq('id', assignmentId)
      .single();

    if (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch assignment:', error);
    throw error;
  }
}

// Local mock vocabulary for fallback when Supabase is not available
const mockVocabularies = [
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
];

// Validate Latin word input with Supabase fallback to mock data
export async function validateLatinWord(
  englishMeaning: string,
  userInput: string,
  assignmentId: string
): Promise<WordValidationResult> {
  let vocabulary: any = null;

  try {
    // First, try to get the vocabulary record from Supabase
    const { data, error: vocabError } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('assignment_id', assignmentId)
      .ilike('english_meaning', englishMeaning)
      .single();

    if (!vocabError && data) {
      vocabulary = data;
    }
  } catch (supabaseError) {
    console.warn('Supabase connection failed, using mock data:', supabaseError);
  }

  // Fallback to mock data if Supabase failed
  if (!vocabulary) {
    vocabulary = mockVocabularies.find(
      (v) =>
        v.assignment_id === assignmentId &&
        v.english_meaning.toLowerCase() === englishMeaning.toLowerCase()
    );
  }

  // If still no vocabulary found, return failure
  if (!vocabulary) {
    console.error('No vocabulary found for:', englishMeaning);
    return {
      is_correct: false,
      correct_word: '',
      hint_level: 0,
      gold_reward: 0,
      current_hint: 'Word not found in vocabulary',
    };
  }

  const trimmedInput = userInput.trim().toLowerCase();
  const correctWord = vocabulary.latin_word.toLowerCase();

  // Check if answer is correct
  if (trimmedInput === correctWord) {
    return {
      is_correct: true,
      correct_word: vocabulary.latin_word,
      hint_level: 0,
      gold_reward: vocabulary.difficulty * 10,
    };
  }

  // Calculate hint level based on attempts
  const hints = vocabulary.hints || [];
  const inputLength = trimmedInput.length;
  const maxHints = hints.length;

  // Progressive hint system: show more hints as user tries more
  const hintLevel = Math.min(Math.max(0, inputLength), maxHints - 1);

  return {
    is_correct: false,
    correct_word: vocabulary.latin_word,
    hint_level: hintLevel,
    gold_reward: Math.max(1, (vocabulary.difficulty * 10) - (hintLevel * 2)),
    current_hint: hints[hintLevel] || hints[hints.length - 1] || vocabulary.latin_word.substring(0, Math.min(3, vocabulary.latin_word.length)),
  };
}

// Create or update learning progress
export async function updateLearningProgress(
  userId: string,
  vocabularyId: string,
  isCorrect: boolean
): Promise<void> {
  try {
    // First, try to get existing progress
    const { data: existingProgress } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('vocabulary_id', vocabularyId)
      .single();

    if (existingProgress) {
      // Update existing progress
      const { error } = await supabase
        .from('learning_progress')
        .update({
          attempts: existingProgress.attempts + 1,
          correct_answers: existingProgress.correct_answers + (isCorrect ? 1 : 0),
          last_answered: new Date().toISOString(),
          mastery_level: Math.min(100, Math.max(0,
            existingProgress.mastery_level + (isCorrect ? 10 : -5)
          )),
        })
        .eq('id', existingProgress.id);

      if (error) {
        console.error('Error updating learning progress:', error);
        throw error;
      }
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('learning_progress')
        .insert({
          user_id: userId,
          vocabulary_id: vocabularyId,
          attempts: 1,
          correct_answers: isCorrect ? 1 : 0,
          last_answered: new Date().toISOString(),
          mastery_level: isCorrect ? 10 : 0,
        });

      if (error) {
        console.error('Error creating learning progress:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to update learning progress:', error);
    throw error;
  }
}

// Create a new game session
export async function createGameSession(
  userId: string,
  assignmentId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        assignment_id: assignmentId,
        status: 'playing',
        words_learned: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating game session:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Failed to create game session:', error);
    throw error;
  }
}

// Update game session
export async function updateGameSession(
  sessionId: string,
  updates: Partial<GameSession>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating game session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update game session:', error);
    throw error;
  }
}

// Get user's learning progress for an assignment
export async function getUserProgress(
  userId: string,
  assignmentId: string
): Promise<LearningProgress[]> {
  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        *,
        vocabularies!inner (
          assignment_id,
          english_meaning,
          latin_word
        )
      `)
      .eq('user_id', userId)
      .eq('vocabularies.assignment_id', assignmentId);

    if (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    throw error;
  }
}

// Mock user ID for development (replace with actual auth when implemented)
export function getMockUserId(): string {
  return 'mock-user-123';
}