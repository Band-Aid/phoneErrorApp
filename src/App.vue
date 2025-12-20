<script setup lang="ts">
import { ref } from 'vue'
import Dialer from './components/Dialer.vue'
import MathQuiz from './components/MathQuiz.vue'

type Mode = 'dialer' | 'mathquiz'
const currentMode = ref<Mode>('dialer')

function toggleMode() {
  currentMode.value = currentMode.value === 'dialer' ? 'mathquiz' : 'dialer'
}
</script>

<template>
  <div class="mode-toggle">
    <button @click="toggleMode" class="toggle-btn">
      {{ currentMode === 'dialer' ? '🧮 Math Quiz' : '📱 Dialer' }}
    </button>
  </div>
  
  <Dialer v-if="currentMode === 'dialer'" />
  <MathQuiz v-else />
</template>

<style scoped>
.mode-toggle {
  width: 100%;
  max-width: 520px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.toggle-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.toggle-btn:active {
  transform: translateY(0);
}
</style>
