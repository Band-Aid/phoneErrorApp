<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type QuizMode = 'addition' | 'subtraction'

const num1 = ref<number>(0)
const num2 = ref<number>(0)
const answer = ref<string>('')
const message = ref<string>('')
const isAnimating = ref<boolean>(false)
const quizElement = ref<HTMLElement | null>(null)
const showErrorPopup = ref<boolean>(false)
const quizMode = ref<QuizMode>('addition')
// Track timeouts for cleanup
let celebrationTimeouts: number[] = []
let questionTimeout: number | null = null
let errorPopupTimeout: number | null = null
let errorAudio: HTMLAudioElement | null = null

// Generate random 1-digit numbers
function generateQuestion() {
  if (quizMode.value === 'subtraction') {
    // For subtraction, ensure num1 >= num2 so result is never negative
    num1.value = Math.floor(Math.random() * 9) + 1  // 1–9
    num2.value = Math.floor(Math.random() * (num1.value + 1)) // 0–num1
  } else {
    num1.value = Math.floor(Math.random() * 10)
    num2.value = Math.floor(Math.random() * 10)
  }
  answer.value = ''
  message.value = ''
}

function switchMode(mode: QuizMode) {
  quizMode.value = mode
  generateQuestion()
}

const correctAnswer = computed(() =>
  quizMode.value === 'subtraction' ? num1.value - num2.value : num1.value + num2.value
)

const operator = computed(() => quizMode.value === 'subtraction' ? '−' : '+')

function pressDigit(d: number) {
  if (isAnimating.value) return
  // Max answer: addition = 18, subtraction = 9 — both fit in 2 digits
  if (answer.value.length >= 2) return
  message.value = ''
  answer.value += d.toString()
}

async function submit() {
  if (isAnimating.value || answer.value === '') return
  
  const userAnswer = parseInt(answer.value, 10)
  
  if (userAnswer === correctAnswer.value) {
    message.value = '🎉 Correct! Great job!'
    
    // Trigger celebration animations
    await celebrateCorrectAnswer()
    
    // Generate new question after celebration
    questionTimeout = window.setTimeout(() => {
      generateQuestion()
      questionTimeout = null
    }, 3000)
  } else {
    message.value = `❌ Incorrect. Try again!`
    answer.value = ''
    
    // Show error popup for 1 second
    showErrorPopup.value = true
    if (errorPopupTimeout !== null) {
      clearTimeout(errorPopupTimeout)
    }
    errorPopupTimeout = window.setTimeout(() => {
      showErrorPopup.value = false
      errorPopupTimeout = null
    }, 1000)
    
    // Play error sound
    try {
      if (!errorAudio) {
        import('../assets/voice.mp3').then(module => {
          errorAudio = new Audio(module.default)
          errorAudio.currentTime = 0
          errorAudio.play().catch(() => {})
        })
      } else {
        errorAudio.currentTime = 0
        errorAudio.play().catch(() => {})
      }
    } catch (e) {
      // Silently ignore audio errors
    }
  }
}

async function celebrateCorrectAnswer() {
  isAnimating.value = true
  
  try {
    // Dynamic import confetti with error handling
    const confetti = (await import('canvas-confetti')).default
    
    // Random animation selection
    const animations = ['rotate', 'shake', 'jump', 'swipe-out']
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)]
    
    // Use template ref instead of querySelector
    if (quizElement.value) {
      // Apply the animation
      quizElement.value.classList.add(randomAnimation)
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Multiple confetti bursts for extra celebration
      celebrationTimeouts.push(window.setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        })
      }, 200))
      
      celebrationTimeouts.push(window.setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        })
      }, 400))
      
      // Remove animation class after it completes
      celebrationTimeouts.push(window.setTimeout(() => {
        if (quizElement.value) {
          quizElement.value.classList.remove(randomAnimation)
        }
        isAnimating.value = false
      }, 2000))
    }
  } catch (error) {
    // Fallback if confetti import fails
    console.error('Failed to load confetti:', error)
    isAnimating.value = false
  }
}

function clearAnswer() {
  answer.value = ''
  message.value = ''
}

function newQuestion() {
  if (questionTimeout !== null) {
    clearTimeout(questionTimeout)
    questionTimeout = null
  }
  generateQuestion()
}

onMounted(() => {
  generateQuestion()
})

onUnmounted(() => {
  // Clean up all timeouts
  celebrationTimeouts.forEach(timeout => clearTimeout(timeout))
  celebrationTimeouts = []
  
  if (questionTimeout !== null) {
    clearTimeout(questionTimeout)
    questionTimeout = null
  }
  
  if (errorPopupTimeout !== null) {
    clearTimeout(errorPopupTimeout)
    errorPopupTimeout = null
  }
})
</script>

<template>
  <div class="math-quiz" ref="quizElement">
    <!-- Mode selector -->
    <div class="mode-selector">
      <button
        class="mode-btn"
        :class="{ active: quizMode === 'addition' }"
        @click="switchMode('addition')"
      >➕ Addition</button>
      <button
        class="mode-btn"
        :class="{ active: quizMode === 'subtraction' }"
        @click="switchMode('subtraction')"
      >➖ Subtraction</button>
    </div>

    <div class="question-display">
      <div class="squares-group inline-squares">
        <div v-for="i in num1" :key="'a'+i" class="sq sq-green"></div>
      </div>
      <span class="operator">{{ operator }}</span>
      <div class="squares-group inline-squares">
        <div
          v-for="i in num2"
          :key="'b'+i"
          class="sq"
          :class="quizMode === 'addition' ? 'sq-pink' : 'sq-red sq-gone'"
        ></div>
      </div>
      <span class="equals">=</span>
      <span class="answer-box">{{ answer || '?' }}</span>
    </div>
    
    <div class="grid">
      <button
        v-for="d in [1,2,3,4,5,6,7,8,9]"
        :key="d"
        class="digit"
        @click="pressDigit(d)"
        :disabled="isAnimating"
      >
        {{ d }}
      </button>
      <div class="grid-spacer" aria-hidden="true"></div>
      <button
        class="digit zero"
        @click="pressDigit(0)"
        :disabled="isAnimating"
      >
        0
      </button>
      <div class="grid-spacer" aria-hidden="true"></div>
    </div>
    
    <div class="actions">
      <button class="submit" @click="submit" :disabled="!answer || isAnimating">Submit</button>
      <button class="clear" @click="clearAnswer" :disabled="!answer">Clear</button>
      <button class="new-question" @click="newQuestion">New ?</button>
    </div>
    
    <p class="message" :class="{ success: message.includes('Correct'), error: message.includes('Incorrect') }">
      {{ message }}
    </p>
    
    <!-- Error Popup -->
    <div v-if="showErrorPopup" class="error-popup">
      ❌ Network Error!
    </div>
  </div>
</template>

<style scoped>
.math-quiz {
  width: 100%;
  max-width: 520px;
  margin: 0;
  font-family: system-ui, sans-serif;
  text-align: center;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.quiz-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #42b883;
  margin-bottom: 1rem;
}

/* Mode selector */
.mode-selector {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.mode-btn {
  flex: 1;
  padding: 0.55rem 0.8rem;
  border: 2px solid #444;
  border-radius: 20px;
  background: #222;
  color: #aaa;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}

.mode-btn.active {
  background: #42b883;
  color: #fff;
  border-color: #42b883;
}

.mode-btn:hover:not(.active) {
  background: #333;
  color: #fff;
}

.question-display {
  background: #111;
  color: #fff;
  padding: 1rem 1.2rem;
  border-radius: 18px;
  min-height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-bottom: 1.25rem;
  font-size: 2.5rem;
  font-weight: 700;
  flex-wrap: wrap;
}

.operator {
  color: #ff79c6;
}

.equals {
  color: #f1fa8c;
}

.answer-box {
  color: #8be9fd;
  min-width: 3rem;
  text-align: center;
}

/* Visual hint squares */
.squares-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  max-width: 130px;
}

.inline-squares {
  max-width: 130px;
}

.sq {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: inline-block;
}

.sq-green {
  background: #42b883;
  box-shadow: 0 2px 6px rgba(66, 184, 131, 0.5);
}

.sq-pink {
  background: #ff79c6;
  box-shadow: 0 2px 6px rgba(255, 121, 198, 0.5);
}

.sq-red {
  background: #ff5555;
  box-shadow: 0 2px 6px rgba(255, 85, 85, 0.5);
}

/* Disappearing animation for subtracted squares */
.sq-gone {
  animation: disappear 1.2s ease-in-out infinite;
}

@keyframes disappear {
  0%   { opacity: 1;   transform: scale(1); }
  40%  { opacity: 0.2; transform: scale(1.3) rotate(15deg); }
  60%  { opacity: 0;   transform: scale(0.4) rotate(-10deg); }
  80%  { opacity: 0;   transform: scale(0.4); }
  100% { opacity: 1;   transform: scale(1); }
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;
  margin: 0 auto 0.75rem;
  grid-auto-rows: 1fr;
  align-items: stretch;
  justify-items: stretch;
}

.digit {
  background: #222;
  color: #fff;
  border: 1px solid #333;
  border-radius: 22px;
  font-size: 1.8rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  height: clamp(80px, 21vw, 130px);
}

.digit:active {
  transform: none !important;
}

.digit:hover {
  background: #333;
}

.grid-spacer {
  height: clamp(80px, 21vw, 130px);
}

.zero {
  grid-column: 2;
}

.actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.9rem;
}

.submit, .clear, .new-question {
  flex: 1;
  padding: 1.05rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.05rem;
  transition: background 0.2s;
}

.submit {
  background: #42b883;
  color: #fff;
}

.submit:hover:not(:disabled) {
  background: #36926b;
}

.submit:disabled {
  background: #555;
  cursor: not-allowed;
}

.clear {
  background: #888;
  color: #fff;
}

.clear:disabled {
  background: #555;
  cursor: not-allowed;
}

.clear:hover:not(:disabled) {
  background: #666;
}

.new-question {
  background: #ff79c6;
  color: #fff;
}

.new-question:hover {
  background: #d45b9e;
}

.message {
  min-height: 2rem;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.success {
  color: #42b883;
}

.error {
  color: #ff5555;
}

/* Error Popup */
.error-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ff5555;
  color: white;
  padding: 1.5rem 2.5rem;
  border-radius: 16px;
  font-size: 1.3rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(255, 85, 85, 0.5);
  z-index: 1000;
  animation: popupAppear 0.2s ease-out;
}

@keyframes popupAppear {
  from {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* Celebration Animations */
@keyframes rotate {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-2deg); }
  20%, 40%, 60%, 80% { transform: translateX(10px) rotate(2deg); }
}

@keyframes jump {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-30px); }
  50% { transform: translateY(-15px); }
  75% { transform: translateY(-25px); }
}

@keyframes swipe-out {
  0% { transform: translateX(0); opacity: 1; }
  40% { transform: translateX(100vw); opacity: 0; }
  60% { transform: translateX(-100vw); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.math-quiz.rotate {
  animation: rotate 1s ease-in-out;
}

.math-quiz.shake {
  animation: shake 0.8s ease-in-out;
}

.math-quiz.jump {
  animation: jump 1s ease-in-out;
}

.math-quiz.swipe-out {
  animation: swipe-out 1.5s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .math-quiz.rotate,
  .math-quiz.shake,
  .math-quiz.jump,
  .math-quiz.swipe-out {
    animation: none;
  }
  .sq-gone {
    animation: none;
    opacity: 0.35;
  }
}

@media (min-width: 560px) {
  .digit { font-size: 2rem; }
  .question-display { font-size: 2.8rem; }
}

@media (max-height: 720px) {
  .quiz-title { font-size: 1.5rem; margin-bottom: 0.7rem; }
  .question-display { margin-bottom: 0.9rem; padding: 1.2rem 1.2rem; font-size: 2rem; }
  .grid { gap: 0.85rem; }
  .digit, .grid-spacer { height: clamp(70px, 20vw, 115px); font-size: 1.55rem; }
  .actions { margin-top: 0.6rem; }
  .submit, .clear, .new-question { padding: 0.85rem; font-size: 1rem; }
}

@media (max-width: 420px) {
  .digit { height: clamp(78px, 26vw, 120px); font-size: 1.75rem; }
  .question-display { font-size: 2.2rem; padding: 1.2rem 1.2rem; }
  .submit, .clear, .new-question { font-size: 1rem; padding: 0.95rem; }
}
</style>
