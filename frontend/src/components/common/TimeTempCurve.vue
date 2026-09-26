<script setup lang="ts">
import { computed } from 'vue'

interface CurvePoint {
  tempC: number
  minutes: number
  label?: string
}

const props = withDefaults(defineProps<{
  points: CurvePoint[]
  selectedTemp?: number
  title?: string
}>(), {
  selectedTemp: 20,
  title: '温度—时间补偿'
})

const emit = defineEmits<{
  'pick-temp': [tempC: number]
}>()

const viewWidth = 520
const viewHeight = 200
const padding = { left: 42, right: 20, top: 18, bottom: 34 }

const sortedPoints = computed(() => [...props.points]
  .filter((point) => Number.isFinite(point.tempC) && Number.isFinite(point.minutes))
  .sort((a, b) => a.tempC - b.tempC))

const bounds = computed(() => {
  if (sortedPoints.value.length === 0) {
    return { minTemp: 18, maxTemp: 22, minMinutes: 0, maxMinutes: 10 }
  }
  const temps = sortedPoints.value.map((point) => point.tempC)
  const minutes = sortedPoints.value.map((point) => point.minutes)
  const minTemp = Math.floor(Math.min(...temps) - 1)
  const maxTemp = Math.ceil(Math.max(...temps) + 1)
  const minMinutes = Math.max(0, Math.floor(Math.min(...minutes) * 0.8))
  const maxMinutes = Math.ceil(Math.max(...minutes) * 1.15)
  return {
    minTemp,
    maxTemp: maxTemp === minTemp ? minTemp + 1 : maxTemp,
    minMinutes,
    maxMinutes: maxMinutes === minMinutes ? minMinutes + 1 : maxMinutes
  }
})

function xFor(tempC: number): number {
  const ratio = (tempC - bounds.value.minTemp) / (bounds.value.maxTemp - bounds.value.minTemp)
  return padding.left + ratio * (viewWidth - padding.left - padding.right)
}

function yFor(minutes: number): number {
  const ratio = (minutes - bounds.value.minMinutes) / (bounds.value.maxMinutes - bounds.value.minMinutes)
  return viewHeight - padding.bottom - ratio * (viewHeight - padding.top - padding.bottom)
}

const chartPoints = computed(() => sortedPoints.value.map((point) => ({
  ...point,
  x: xFor(point.tempC),
  y: yFor(point.minutes)
})))

const polyline = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const tempTicks = computed(() => {
  const span = bounds.value.maxTemp - bounds.value.minTemp
  return Array.from({ length: Math.min(6, span + 1) }, (_, index) => {
    if (index === 0) return bounds.value.minTemp
    return Math.round(bounds.value.minTemp + (span * index) / Math.min(5, span))
  }).filter((value, index, list) => list.indexOf(value) === index)
})

const minuteTicks = computed(() => Array.from({ length: 4 }, (_, index) => {
  const ratio = index / 3
  return bounds.value.minMinutes + (bounds.value.maxMinutes - bounds.value.minMinutes) * ratio
}))

function pick(tempC: number): void {
  emit('pick-temp', tempC)
}
</script>

<template>
  <section class="curve-card">
    <div class="curve-card__head">
      <div>
        <h3>{{ title }}</h3>
        <p>点击温度点可回填当前查看温度</p>
      </div>
      <span>{{ bounds.minTemp }}–{{ bounds.maxTemp }}°C</span>
    </div>
    <svg :viewBox="`0 0 ${viewWidth} ${viewHeight}`" role="img" aria-label="显影温度与时间补偿曲线">
      <defs>
        <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cf7f3c" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#cf7f3c" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <line
        v-for="tick in minuteTicks"
        :key="`y-${tick}`"
        :x1="padding.left"
        :x2="viewWidth - padding.right"
        :y1="yFor(tick)"
        :y2="yFor(tick)"
        class="grid-line"
      />
      <line
        v-for="tick in tempTicks"
        :key="`x-${tick}`"
        :x1="xFor(tick)"
        :x2="xFor(tick)"
        :y1="padding.top"
        :y2="viewHeight - padding.bottom"
        class="grid-line"
      />
      <polyline v-if="chartPoints.length > 1" :points="polyline" class="curve-line" />
      <polygon
        v-if="chartPoints.length > 1"
        :points="`${padding.left},${viewHeight - padding.bottom} ${polyline} ${viewWidth - padding.right},${viewHeight - padding.bottom}`"
        fill="url(#curveFill)"
      />
      <g v-for="(point, index) in chartPoints" :key="`${point.tempC}-${point.minutes}-${index}`" class="point" @click="pick(point.tempC)">
        <circle
          :cx="point.x"
          :cy="point.y"
          :r="point.tempC === selectedTemp ? 7 : 5"
          :class="{ selected: point.tempC === selectedTemp }"
        />
        <title>{{ point.tempC }}°C / {{ point.minutes.toFixed(2) }} 分钟</title>
        <text :x="point.x" :y="point.y - 12" text-anchor="middle">{{ point.minutes }}</text>
      </g>
      <text
        v-for="tick in tempTicks"
        :key="`label-x-${tick}`"
        :x="xFor(tick)"
        :y="viewHeight - 10"
        text-anchor="middle"
        class="axis-label"
      >{{ tick }}°C</text>
      <text
        v-for="tick in minuteTicks"
        :key="`label-y-${tick}`"
        :x="padding.left - 8"
        :y="yFor(tick) + 3"
        text-anchor="end"
        class="axis-label"
      >{{ tick.toFixed(1) }}</text>
    </svg>
  </section>
</template>

<style scoped>
.curve-card {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fffdfa;
}

.curve-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  margin-bottom: 8px;
}

.curve-card__head h3 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
}

.curve-card__head p {
  margin: 4px 0 0;
  color: var(--ink-soft);
  font-size: 12px;
}

.curve-card__head > span {
  padding: 4px 8px;
  border-radius: 999px;
  color: #8c4b18;
  background: #f7e6cf;
  font-size: 11px;
}

svg {
  display: block;
  width: 100%;
  min-height: 160px;
}

.grid-line {
  stroke: #e9dfd1;
  stroke-dasharray: 3 4;
  stroke-width: 1;
}

.curve-line {
  fill: none;
  stroke: #b7662f;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.point {
  cursor: pointer;
}

.point circle {
  fill: #fffaf2;
  stroke: #b7662f;
  stroke-width: 2;
}

.point circle.selected {
  fill: #b7662f;
  stroke: #fff6e8;
  stroke-width: 3;
}

.point text {
  fill: #805237;
  font-size: 10px;
  pointer-events: none;
}

.axis-label {
  fill: #8a7a69;
  font-size: 10px;
}
</style>
