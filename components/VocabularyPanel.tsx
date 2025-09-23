'use client';

import { useState, useEffect } from 'react';
import { Vocabulary, WordValidationResult } from '@/types/game';
import { validateLatinWord } from '@/lib/vocabulary';

interface VocabularyPanelProps {
  vocabularies: Vocabulary[];
  assignmentId: string;
  onGoldEarned: (amount: number) => void;
  onWordLearned: (vocabularyId: string) => void;
  onValidationResult: (result: WordValidationResult) => void;
}

export default function VocabularyPanel({
  vocabularies,
  assignmentId,
  onGoldEarned,
  onWordLearned,
  onValidationResult,
}: VocabularyPanelProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'hint';
    message: string;
  } | null>(null);

  const currentWord = vocabularies[currentWordIndex];

  useEffect(() => {
    // Reset state when word changes
    setUserInput('');
    setCurrentHint('');
    setAttempts(0);
    setFeedback(null);
  }, [currentWordIndex]);

  const handleSubmit = async () => {
    if (!userInput.trim() || !currentWord || isLoading) return;

    setIsLoading(true);

    try {
      const result = await validateLatinWord(
        currentWord.english_meaning,
        userInput,
        assignmentId
      );

      onValidationResult(result);

      if (result.is_correct) {
        // Correct answer
        setFeedback({
          type: 'success',
          message: `Correct! "${result.correct_word}" means "${currentWord.english_meaning}"`
        });

        onGoldEarned(result.gold_reward);
        onWordLearned(currentWord.id);
        setLearnedWords(prev => new Set([...prev, currentWord.id]));

        // Move to next word after a delay
        setTimeout(() => {
          if (currentWordIndex < vocabularies.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
          } else {
            setCurrentWordIndex(0); // Loop back to start
          }
        }, 2000);

      } else {
        // Incorrect answer
        setAttempts(prev => prev + 1);
        setCurrentHint(result.current_hint || '');

        setFeedback({
          type: 'error',
          message: `Incorrect. ${result.current_hint ? `Hint: ${result.current_hint}` : 'Try again!'}`
        });

        if (attempts >= 2) {
          // After 3 attempts, show the answer
          setFeedback({
            type: 'hint',
            message: `The answer was "${result.correct_word}". Try the next word!`
          });

          setTimeout(() => {
            if (currentWordIndex < vocabularies.length - 1) {
              setCurrentWordIndex(prev => prev + 1);
            } else {
              setCurrentWordIndex(0);
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error validating word:', error);
      setFeedback({
        type: 'error',
        message: 'Error validating word. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentWordIndex < vocabularies.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setCurrentWordIndex(0);
    }
  };

  const getHintText = () => {
    if (currentHint) {
      return `Hint: ${currentHint}`;
    }
    if (attempts > 0 && currentWord?.hints?.length) {
      const hintIndex = Math.min(attempts - 1, currentWord.hints.length - 1);
      return `Hint: ${currentWord.hints[hintIndex]}`;
    }
    return '';
  };

  if (!vocabularies.length) {
    return (
      <div className="text-center text-gray-400 p-4">
        No vocabulary words available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex justify-between items-center text-sm text-gray-300">
        <span>Word {currentWordIndex + 1} of {vocabularies.length}</span>
        <span>{learnedWords.size} learned</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-game-accent h-2 rounded-full transition-all duration-300"
          style={{ width: `${(learnedWords.size / vocabularies.length) * 100}%` }}
        />
      </div>

      {/* Current word */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-2">
            English meaning:
          </label>
          <div className="text-xl font-bold text-white mb-2">
            {currentWord?.english_meaning}
          </div>
          <div className="text-sm text-gray-400">
            Difficulty: {currentWord?.difficulty}/5 | {currentWord?.word_length} letters
          </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter Latin word..."
            disabled={isLoading}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-game-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim() || isLoading}
            className="flex-1 bg-game-accent hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 py-2 px-4 rounded font-semibold transition-colors"
          >
            {isLoading ? 'Checking...' : 'Submit'}
          </button>
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Hint */}
        {getHintText() && (
          <div className="text-sm text-game-accent mb-2">
            {getHintText()}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`text-sm p-2 rounded ${
            feedback.type === 'success'
              ? 'bg-green-800 text-green-200'
              : feedback.type === 'error'
              ? 'bg-red-800 text-red-200'
              : 'bg-blue-800 text-blue-200'
          }`}>
            {feedback.message}
          </div>
        )}
      </div>

      {/* Vocabulary list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <h4 className="text-sm font-semibold text-gray-300">All Words</h4>
        {vocabularies.map((vocab, index) => (
          <div
            key={vocab.id}
            className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
              index === currentWordIndex
                ? 'bg-game-accent bg-opacity-20 border-game-accent text-white'
                : learnedWords.has(vocab.id)
                ? 'bg-green-800 bg-opacity-30 border-green-600 text-green-200'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setCurrentWordIndex(index)}
          >
            <div className="flex justify-between items-center">
              <span>{vocab.english_meaning}</span>
              <div className="flex items-center gap-2">
                {learnedWords.has(vocab.id) && (
                  <span className="text-green-400 text-xs">✓</span>
                )}
                <span className="text-xs">{vocab.difficulty}/5</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}