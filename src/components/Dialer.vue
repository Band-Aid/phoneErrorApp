<script setup lang="ts">
import { ref } from 'vue'

// Digits 1-9 for the grid, and 0 separately centered beneath
const gridDigits = Array.from({ length: 9 }, (_, i) => i + 1)
const entered = ref<string>('')
const message = ref<string>('')
// Prepare audio (lazy create on first use to avoid autoplay issues on some browsers)
let errorAudio: HTMLAudioElement | null = null

function press(d: number) {
  message.value = ''
  // treat 10 as just '10' appended, others single digit
  entered.value += d.toString()
}

async function submit() {
  if (entered.value === '0840') {
    message.value = 'Success!'
    // dynamic import so bundle size stays small
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    })
  } else {
    message.value = 'Incorrect number'
    try {
      if (!errorAudio) {
        const voiceSrc = (await import('../assets/voice.mp3')).default
        errorAudio = new Audio(voiceSrc)
      } else {
        // rewind if already created
        errorAudio.currentTime = 0
      }
      // Play after a short microtask to avoid blocking UI updates
      Promise.resolve().then(() => errorAudio?.play().catch(() => {}))
    } catch (e) {
      // Silently ignore audio errors (e.g., autoplay restrictions)
    }
  // Trigger wobble animation on the whole screen
  const body = document.body
  body.classList.remove('wobble') // reset if still applied
  // force reflow to restart animation
  void body.offsetWidth
  body.classList.add('wobble')
  // remove after animation ends to allow retrigger
  setTimeout(() => body.classList.remove('wobble'), 650)
  }
}

function clearInput() {
  entered.value = ''
  message.value = ''
}
</script>

<template>
  <div class="dialer">
    <div class="display" data-testid="display">{{ entered || 'Enter number' }}</div>
    <div class="grid">
      <button v-for="d in gridDigits" :key="d" class="digit" @click="press(d)">{{ d }}</button>
      <!-- 0 centered under the 7 8 9 row -->
      <div class="grid-spacer" aria-hidden="true"></div>
      <button class="digit zero" @click="press(0)">0</button>
      <div class="grid-spacer" aria-hidden="true"></div>
    </div>
    <div class="actions">
      <button class="submit" @click="submit">Submit</button>
      <button class="clear" @click="clearInput" :disabled="!entered">Clear</button>
    </div>
    <p class="message" :class="{ success: message==='Success!', error: message && message!=='Success!' }">{{ message }}</p>
  </div>
</template>

<style scoped>
.dialer { width:100%; max-width:520px; margin:0; font-family:system-ui,sans-serif; text-align:center; padding:0; display:flex; flex-direction:column; flex:1; }
.display { background:#111; color:#0f0; padding: 1.2rem 1.6rem; border-radius: 18px; min-height: 3.6rem; display:flex; align-items:center; justify-content:center; letter-spacing:4px; font-weight:700; margin-bottom:1.25rem; font-size:1.65rem; }
.grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:1.1rem; margin:0 auto .75rem; grid-auto-rows:1fr; align-items:stretch; justify-items:stretch; }
.digit { background:#222; color:#fff; border:1px solid #333; border-radius:22px; font-size:1.8rem; cursor:pointer; transition:background .15s; touch-action:manipulation; -webkit-tap-highlight-color:transparent; display:flex; align-items:center; justify-content:center; user-select:none; height:clamp(80px, 21vw, 130px); }
.digit:active { transform:none !important; }
.digit:hover { background:#333; }
.grid-spacer { height:clamp(80px, 21vw, 130px); }
.zero { grid-column:2; }
.actions { display:flex; gap:.9rem; margin-top:.9rem; }
.submit, .clear { flex:1; padding:1.05rem; border:none; border-radius:16px; cursor:pointer; font-weight:700; font-size:1.15rem; }
.submit { background:#42b883; color:#fff; }
.submit:hover { background:#36926b; }
.clear { background:#888; color:#fff; }
.clear:disabled { background:#555; cursor:not-allowed; }
.message { min-height:1.5rem; font-weight:600; font-size:.95rem; }
.success { color:#42b883; }
.error { color:#ff5555; }

@media (min-width: 560px) {
  .digit { font-size:2rem; }
  .display { font-size:2rem; }
}

@media (max-height: 720px) {
  .display { margin-bottom:.9rem; padding:1rem 1.2rem; font-size:1.45rem; }
  .grid { gap:.85rem; }
  .digit, .grid-spacer { height:clamp(70px, 20vw, 115px); font-size:1.55rem; }
  .actions { margin-top:.6rem; }
  .submit, .clear { padding:.85rem; font-size:1.05rem; }
}

@media (max-width: 420px) {
  .digit { height: clamp(78px, 26vw, 120px); font-size:1.75rem; }
  .display { font-size:1.55rem; padding:1.1rem 1.4rem; }
  .submit, .clear { font-size:1.1rem; padding:1rem; }
}
</style>
