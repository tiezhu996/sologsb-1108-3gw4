<script setup lang="ts">
import { computed } from 'vue'
import type { PushPull } from '../../types/dev-recipe'

const props = withDefaults(defineProps<{
  value: PushPull
  showHint?: boolean
}>(), {
  showHint: false
})

const meta = computed(() => {
  const map: Record<PushPull, { label: string; hint: string; className: string }> = {
    '-1': { label: '拉档 -1', hint: '按评片结果缩短显影 15% 至 20%', className: 'pull' },
    'N': { label: '标准 N', hint: '按基准显影时间执行', className: 'normal' },
    '+1': { label: '推档 +1', hint: '延长显影约 25%，留意高光', className: 'push' },
    '+2': { label: '推档 +2', hint: '延长显影约 50%，加强反差与颗粒', className: 'push-strong' }
  }
  return map[props.value]
})
</script>

<template>
  <span class="push-tag" :class="`push-tag--${meta.className}`">
    <span>{{ meta.label }}</span>
    <small v-if="showHint">{{ meta.hint }}</small>
  </span>
</template>

<style scoped>
.push-tag {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: fit-content;
  padding: 4px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.push-tag small {
  color: inherit;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.78;
}

.push-tag--pull {
  border-color: #93b9c1;
  color: #275f6a;
  background: #e5f2f4;
}

.push-tag--normal {
  border-color: #c5b79f;
  color: #6d5c43;
  background: #f4eee2;
}

.push-tag--push {
  border-color: #d9a15b;
  color: #8f5318;
  background: #fff0d5;
}

.push-tag--push-strong {
  border-color: #d18471;
  color: #8f3f2f;
  background: #fbe2da;
}
</style>
