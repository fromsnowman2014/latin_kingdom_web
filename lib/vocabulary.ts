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

// Validate Latin word input
export async function validateLatinWord(
  englishMeaning: string,
  userInput: string,
  assignmentId: string
): Promise<WordValidationResult> {
  try {
    // First, get the vocabulary record
    const { data: vocabulary, error: vocabError } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('assignment_id', assignmentId)
      .ilike('english_meaning', englishMeaning)
      .single();

    if (vocabError || !vocabulary) {
      console.error('Error finding vocabulary:', vocabError);
      return {
        is_correct: false,
        correct_word: '',
        hint_level: 0,
        gold_reward: 0,
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

    // Calculate hint level based on input length
    const inputLength = trimmedInput.length;
    const hints = vocabulary.hints || [];
    const maxHints = hints.length;
    const hintLevel = Math.min(inputLength + 1, maxHints);

    return {
      is_correct: false,
      correct_word: vocabulary.latin_word,
      hint_level: hintLevel,
      gold_reward: Math.max(1, (vocabulary.difficulty * 10) - (inputLength * 2)),
      current_hint: hints[hintLevel - 1] || hints[hints.length - 1],
    };
  } catch (error) {
    console.error('Failed to validate word:', error);
    return {
      is_correct: false,
      correct_word: '',
      hint_level: 0,
      gold_reward: 0,
    };
  }
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