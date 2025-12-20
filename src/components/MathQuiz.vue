<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const num1 = ref<number>(0)
const num2 = ref<number>(0)
const answer = ref<string>('')
const message = ref<string>('')
const isAnimating = ref<boolean>(false)
const quizElement = ref<HTMLElement | null>(null)
const showErrorPopup = ref<boolean>(false)

// Track timeouts for cleanup
let celebrationTimeouts: number[] = []
let questionTimeout: number | null = null
let errorPopupTimeout: number | null = null
let errorAudio: HTMLAudioElement | null = null

// Generate random 1-digit numbers
function generateQuestion() {
  num1.value = Math.floor(Math.random() * 10)
  num2.value = Math.floor(Math.random() * 10)
  answer.value = ''
  message.value = ''
}

const correctAnswer = computed(() => num1.value + num2.value)

function pressDigit(d: number) {
  if (isAnimating.value) return
  // Limit answer to 2 digits since max possible sum is 18 (0-9 + 0-9)
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
    <div class="question-display">
      <span class="number">{{ num1 }}</span>
      <span class="operator">+</span>
      <span class="number">{{ num2 }}</span>
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

.question-display {
  background: #111;
  color: #fff;
  padding: 1.5rem 1.6rem;
  border-radius: 18px;
  min-height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.number {
  color: #42b883;
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
