<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: '暂无匹配内容',
  description: '调整筛选条件或新建一条记录后再查看。'
})
</script>

<template>
  <div class="empty-panel">
    <div class="empty-panel__mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path d="M10 15h28v22H10zM15 10h18v5H15zM16 22h16M16 28h11" />
      </svg>
    </div>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-panel {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 42px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  color: var(--ink-soft);
  text-align: center;
  background: rgba(255, 252, 246, 0.72);
}

.empty-panel__mark {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 50%;
  background: #f0e4d0;
}

.empty-panel__mark svg {
  width: 30px;
  fill: none;
  stroke: #8a6743;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.empty-panel strong {
  color: var(--ink);
}

.empty-panel p {
  margin: 0;
  font-size: 13px;
}
</style>
