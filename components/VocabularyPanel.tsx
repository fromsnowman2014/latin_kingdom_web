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

  const handleHint = () => {
    if (!currentWord?.hints?.length) return;

    const hintIndex = Math.min(attempts, currentWord.hints.length - 1);
    const hint = currentWord.hints[hintIndex];

    setFeedback({
      type: 'hint',
      message: `Hint: ${hint}`
    });

    setAttempts(prev => prev + 1);
  };

  const handleSkip = () => {
    if (currentWordIndex < vocabularies.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setCurrentWordIndex(0);
    }
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
      {/* Word List Panel - PRD Design */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Word List</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {vocabularies.map((vocab, index) => (
            <div
              key={vocab.id}
              className={`p-2 rounded text-sm cursor-pointer transition-colors flex justify-between items-center ${
                index === currentWordIndex
                  ? 'bg-game-accent bg-opacity-20 border border-game-accent text-white'
                  : learnedWords.has(vocab.id)
                  ? 'bg-green-800 bg-opacity-30 border border-green-600 text-green-200'
                  : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setCurrentWordIndex(index)}
            >
              <span>
                {index + 1}. {vocab.english_meaning} → {learnedWords.has(vocab.id) ? vocab.latin_word : '?'}
              </span>
              <div className="flex items-center gap-2">
                {learnedWords.has(vocab.id) && (
                  <span className="text-green-400 text-xs">✓</span>
                )}
                <span className="text-xs opacity-70">{vocab.difficulty}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Word Input Area - PRD Design */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">
            Word {currentWordIndex + 1} of {vocabularies.length}
          </div>
          <div className="text-lg font-bold text-white mb-2">
            English: &ldquo;{currentWord?.english_meaning}&rdquo;
          </div>
          <div className="text-sm text-gray-400">
            Difficulty: {currentWord?.difficulty}/5 • {currentWord?.word_length} letters
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-4">
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

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim() || isLoading}
            className="flex-1 bg-game-accent hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 py-2 px-4 rounded font-semibold transition-colors"
          >
            {isLoading ? 'Checking...' : 'Submit'}
          </button>
          <button
            onClick={handleHint}
            disabled={isLoading || !currentWord?.hints?.length}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Hint
          </button>
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`text-sm p-3 rounded ${
            feedback.type === 'success'
              ? 'bg-green-800 text-green-200 border border-green-600'
              : feedback.type === 'error'
              ? 'bg-red-800 text-red-200 border border-red-600'
              : 'bg-blue-800 text-blue-200 border border-blue-600'
          }`}>
            {feedback.message}
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex justify-between items-center text-sm text-gray-300 mb-2">
          <span>Learning Progress</span>
          <span>{learnedWords.size}/{vocabularies.length} learned</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-game-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${(learnedWords.size / vocabularies.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}