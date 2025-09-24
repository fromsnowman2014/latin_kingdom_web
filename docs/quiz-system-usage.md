# Quiz System Usage Guide

## 퀴즈 골드 시스템 개요

새로운 퀴즈 시스템에서는 다음과 같은 규칙으로 골드를 획득할 수 있습니다:

- **문제당 최대 30골드** 획득 가능
- **틀릴 때마다 20%씩 감소**
- **모든 문제를 맞추면** wave 완료 시 최대 골드 획득

## 골드 계산 방식

### 개별 문제 골드 계산
```
첫 번째 시도: 30골드 (100%)
두 번째 시도: 24골드 (80%)
세 번째 시도: 19골드 (64%)
네 번째 시도: 15골드 (51%)
다섯 번째 시도: 12골드 (41%)
```

### 예시 시나리오

#### 시나리오 1: 완벽한 성과 (5문제 모두 첫 번째 시도에 정답)
- 문제 1: 30골드
- 문제 2: 30골드
- 문제 3: 30골드
- 문제 4: 30골드
- 문제 5: 30골드
- **총 획득: 150골드**

#### 시나리오 2: 혼합 성과
- 문제 1: 첫 번째 시도 정답 → 30골드
- 문제 2: 두 번째 시도 정답 → 24골드
- 문제 3: 첫 번째 시도 정답 → 30골드
- 문제 4: 세 번째 시도 정답 → 19골드
- 문제 5: 첫 번째 시도 정답 → 30골드
- **총 획득: 133골드**

## API 사용법

### 1. 퀴즈 설정 가져오기
```javascript
const quizConfig = window.gameCanvas.getQuizConfig();
console.log(quizConfig);
// {
//   maxGoldPerQuestion: 30,
//   wrongAnswerPenalty: 0.2,
//   perfectWaveMultiplier: 1.0
// }
```

### 2. 개별 문제 답안 제출
```javascript
// 문제 ID, 시도 횟수, 정답 여부
const goldEarned = window.gameCanvas.submitQuestionAnswer(1, 1, true);
console.log(`획득한 골드: ${goldEarned}`); // 30골드

// 틀린 경우
const goldEarned2 = window.gameCanvas.submitQuestionAnswer(2, 2, true);
console.log(`획득한 골드: ${goldEarned2}`); // 24골드 (두 번째 시도)
```

### 3. 퀴즈 완료 처리
```javascript
// 퀴즈 결과 객체 생성
const quizResult = {
  totalQuestions: 5,
  correctAnswers: 4,
  wrongAnswers: 1,
  attempts: [
    { questionId: 1, attemptsCount: 1, isCorrect: true, goldEarned: 30 },
    { questionId: 2, attemptsCount: 2, isCorrect: true, goldEarned: 24 },
    { questionId: 3, attemptsCount: 1, isCorrect: true, goldEarned: 30 },
    { questionId: 4, attemptsCount: 3, isCorrect: true, goldEarned: 19 },
    { questionId: 5, attemptsCount: 1, isCorrect: true, goldEarned: 30 }
  ]
};

// 퀴즈 완료 처리
window.gameCanvas.markQuizCompleted(quizResult);
```

## 이벤트 리스너

### Wave 완료 이벤트
```javascript
// GameCanvas 컴포넌트에서
onWaveCompleted={(waveData) => {
  console.log(`Wave ${waveData.wave} 완료!`);
  console.log(`기본 보너스: ${waveData.bonus}골드`);
  console.log(`문제당 최대: ${waveData.maxGoldPerQuestion}골드`);
}}
```

### 문제 답안 이벤트
```javascript
onQuestionAnswered={(questionData) => {
  if (questionData.isCorrect) {
    console.log(questionData.message); // "Correct! +30 gold"
  } else {
    console.log(questionData.message); // "Wrong answer. Next attempt will earn 24 gold."
  }
}}
```

### 퀴즈 완료 이벤트
```javascript
onQuizCompleted={(quizData) => {
  console.log(`총 획득 골드: ${quizData.totalGold}`);
  console.log(quizData.summary); // "Quiz Complete! 4/5 correct (80%) - 133 gold earned"
}}
```

## 실제 사용 예시

```javascript
// 퀴즈 시작 시
const config = window.gameCanvas.getQuizConfig();
let currentQuestion = 1;
let attempts = {};

// 각 문제에 대해
function answerQuestion(questionId, userAnswer, correctAnswer) {
  if (!attempts[questionId]) {
    attempts[questionId] = 0;
  }
  attempts[questionId]++;
  
  const isCorrect = userAnswer === correctAnswer;
  const goldEarned = window.gameCanvas.submitQuestionAnswer(
    questionId, 
    attempts[questionId], 
    isCorrect
  );
  
  if (isCorrect) {
    console.log(`정답! ${goldEarned}골드 획득`);
    currentQuestion++;
  } else {
    console.log(`오답! 다시 시도하세요.`);
  }
  
  return isCorrect;
}

// 모든 퀴즈 완료 시
function completeQuiz(allAttempts) {
  const quizResult = {
    totalQuestions: Object.keys(allAttempts).length,
    correctAnswers: Object.keys(allAttempts).length, // 모두 정답이라고 가정
    wrongAnswers: 0,
    attempts: Object.entries(allAttempts).map(([qId, attemptCount]) => ({
      questionId: parseInt(qId),
      attemptsCount: attemptCount,
      isCorrect: true,
      goldEarned: calculateGold(attemptCount)
    }))
  };
  
  window.gameCanvas.markQuizCompleted(quizResult);
}
```

이 시스템을 통해 플레이어는 더 정확하게 답변할수록 더 많은 골드를 획득할 수 있으며, 게임 진행에 대한 동기부여가 증가합니다.
