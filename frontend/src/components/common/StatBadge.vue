<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  hint?: string
  tone?: 'amber' | 'cyan' | 'rose' | 'slate'
}>(), {
  hint: '',
  tone: 'slate'
})
</script>

<template>
  <div class="stat-badge" :class="`stat-badge--${tone}`">
    <span class="stat-badge__label">{{ label }}</span>
    <strong class="stat-badge__value">{{ value }}</strong>
    <span v-if="hint" class="stat-badge__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.stat-badge {
  display: grid;
  gap: 4px;
  min-width: 130px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(246, 239, 226, 0.88));
  box-shadow: 0 8px 24px rgba(61, 47, 32, 0.06);
}

.stat-badge__label {
  color: var(--ink-soft);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.stat-badge__value {
  color: var(--ink);
  font-family: "Avenir Next Condensed", "DIN Condensed", sans-serif;
  font-size: 27px;
  line-height: 1;
}

.stat-badge__hint {
  color: var(--ink-soft);
  font-size: 12px;
}

.stat-badge--amber {
  border-color: rgba(192, 119, 43, 0.28);
  background: linear-gradient(145deg, #fff8e9, #f5e6ca);
}

.stat-badge--cyan {
  border-color: rgba(41, 127, 137, 0.28);
  background: linear-gradient(145deg, #eefbfb, #d9eff0);
}

.stat-badge--rose {
  border-color: rgba(174, 72, 70, 0.25);
  background: linear-gradient(145deg, #fff4f1, #f3ded8);
}
</style>
