import { QUIZ_CONFIG } from '../config/GameConfig';

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  attempts: QuestionAttempt[];
}

export interface QuestionAttempt {
  questionId: number;
  attemptsCount: number;
  isCorrect: boolean;
  goldEarned: number;
}

export class QuizCalculator {
  /**
   * 개별 문제의 골드를 계산합니다
   * @param attemptsCount 시도 횟수 (1번째 시도면 1, 2번째 시도면 2...)
   * @returns 획득할 골드 양
   */
  static calculateQuestionGold(attemptsCount: number): number {
    if (attemptsCount <= 0) return 0;
    
    const baseGold = QUIZ_CONFIG.MAX_GOLD_PER_QUESTION;
    const wrongAttempts = attemptsCount - 1; // 정답까지의 틀린 시도 횟수
    
    // 틀릴 때마다 20%씩 감소
    const reductionFactor = Math.pow(1 - QUIZ_CONFIG.WRONG_ANSWER_PENALTY, wrongAttempts);
    const goldEarned = Math.floor(baseGold * reductionFactor);
    
    return Math.max(goldEarned, 1); // 최소 1골드는 보장
  }

  /**
   * Wave 완료 시 총 골드를 계산합니다
   * @param quizResult 퀴즈 결과
   * @returns 총 획득 골드
   */
  static calculateWaveGold(quizResult: QuizResult): number {
    let totalGold = 0;
    
    // 각 문제별 골드 합산
    for (const attempt of quizResult.attempts) {
      totalGold += attempt.goldEarned;
    }
    
    // 모든 문제를 첫 번째 시도에 맞췄을 경우 보너스
    const isPerfectScore = quizResult.attempts.every(
      attempt => attempt.attemptsCount === 1 && attempt.isCorrect
    );
    
    if (isPerfectScore && quizResult.totalQuestions > 0) {
      // 퍼펙트 스코어 시 추가 보너스 없음 (이미 최대 골드를 받았으므로)
      // 하지만 미래에 보너스를 추가하고 싶다면 여기서 처리
    }
    
    return totalGold;
  }

  /**
   * 문제를 시도했을 때의 결과를 생성합니다
   * @param questionId 문제 ID
   * @param attemptsCount 시도 횟수
   * @param isCorrect 정답 여부
   * @returns 문제 시도 결과
   */
  static createQuestionAttempt(
    questionId: number,
    attemptsCount: number,
    isCorrect: boolean
  ): QuestionAttempt {
    const goldEarned = isCorrect 
      ? this.calculateQuestionGold(attemptsCount)
      : 0;

    return {
      questionId,
      attemptsCount,
      isCorrect,
      goldEarned,
    };
  }

  /**
   * 퀴즈 진행 상황을 표시하기 위한 문자열을 생성합니다
   * @param quizResult 퀴즈 결과
   * @returns 표시용 문자열
   */
  static getQuizSummary(quizResult: QuizResult): string {
    const totalGold = this.calculateWaveGold(quizResult);
    const accuracy = quizResult.totalQuestions > 0 
      ? Math.round((quizResult.correctAnswers / quizResult.totalQuestions) * 100)
      : 0;
    
    return `Quiz Complete! ${quizResult.correctAnswers}/${quizResult.totalQuestions} correct (${accuracy}%) - ${totalGold} gold earned`;
  }

  /**
   * 실시간으로 문제별 골드 미리보기를 제공합니다
   * @param currentAttempts 현재 시도 횟수
   * @returns 정답 시 획득할 골드
   */
  static previewQuestionGold(currentAttempts: number): number {
    return this.calculateQuestionGold(currentAttempts + 1);
  }
}
