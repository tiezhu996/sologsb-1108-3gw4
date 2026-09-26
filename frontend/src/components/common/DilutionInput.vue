<script setup lang="ts">
import { computed } from 'vue'
import type { Dilution } from '../../types/developer'
import { calculateStockVolume, estimateRolls } from '../../utils/ratio'

const props = withDefaults(defineProps<{
  ratio: Dilution
  workingVolumeMl: number
  rollMl?: number
  readonly?: boolean
  ratioTestId?: string
  volumeTestId?: string
}>(), {
  rollMl: 300,
  readonly: false,
  ratioTestId: '',
  volumeTestId: ''
})

const emit = defineEmits<{
  'update:ratio': [value: Dilution]
  'update:workingVolumeMl': [value: number]
}>()

const ratioModel = computed({
  get: () => props.ratio,
  set: (value: Dilution) => emit('update:ratio', value)
})

const volumeModel = computed({
  get: () => props.workingVolumeMl,
  set: (value: number) => emit('update:workingVolumeMl', Number(value))
})

const stockVolume = computed(() => calculateStockVolume(volumeModel.value, ratioModel.value))
const rolls = computed(() => estimateRolls(volumeModel.value, props.rollMl))
</script>

<template>
  <div class="dilution-input">
    <label>
      <span>稀释比</span>
      <select v-model="ratioModel" :disabled="readonly" :data-testid="ratioTestId || undefined">
        <option value="1:1">1:1</option>
        <option value="1:3">1:3</option>
      </select>
    </label>
    <label>
      <span>工作液总量</span>
      <input v-model.number="volumeModel" type="number" min="0" step="50" :readonly="readonly" :data-testid="volumeTestId || undefined" />
      <em>mL</em>
    </label>
    <div class="dilution-input__result">
      <strong>{{ volumeModel }} mL</strong>
      <span>需浓缩液 {{ stockVolume }} mL · 约可冲 {{ rolls }} 卷 · 每卷 {{ rollMl }} mL</span>
    </div>
  </div>
</template>

<style scoped>
.dilution-input {
  display: grid;
  grid-template-columns: minmax(100px, 0.7fr) minmax(140px, 1fr) minmax(160px, 1.2fr);
  gap: 12px;
  align-items: end;
}

.dilution-input label {
  display: grid;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 12px;
}

.dilution-input input,
.dilution-input select {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  color: var(--ink);
  background: #fffdf9;
  outline: none;
}

.dilution-input input:focus,
.dilution-input select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(181, 102, 39, 0.1);
}

.dilution-input em {
  float: right;
  margin-top: -26px;
  margin-right: 10px;
  color: var(--ink-soft);
  font-size: 11px;
  font-style: normal;
  pointer-events: none;
}

.dilution-input__result {
  display: grid;
  gap: 3px;
  min-height: 62px;
  padding: 9px 12px;
  border: 1px solid rgba(41, 127, 137, 0.2);
  border-radius: 10px;
  color: #285f66;
  background: #eef8f7;
}

.dilution-input__result strong {
  font-size: 18px;
}

.dilution-input__result span {
  color: #52777b;
  font-size: 11px;
}

@media (max-width: 720px) {
  .dilution-input {
    grid-template-columns: 1fr;
  }
}
</style>
