<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import StatBadge from '../components/common/StatBadge.vue'
import TimeTempCurve from '../components/common/TimeTempCurve.vue'
import PushPullTag from '../components/common/PushPullTag.vue'
import { useRecipeFilter } from '../hooks/useRecipeFilter'
import { useDeveloperStore } from '../stores/developerStore'
import { useFilmStore } from '../stores/filmStore'
import { useRecipeStore } from '../stores/recipeStore'
import { useRunStore } from '../stores/runStore'

const filmStore = useFilmStore()
const developerStore = useDeveloperStore()
const recipeStore = useRecipeStore()
const runStore = useRunStore()
const { filmId, dilution, pushPull, filteredRecipes, resetFilters } = useRecipeFilter()
const selectedTemp = ref(20)

const curvePoints = computed(() => {
  const recipes = filteredRecipes.value
  if (recipes.length === 0) return []
  return recipes.map((recipe) => ({
    tempC: recipe.tempC,
    minutes: recipe.devMinutes,
    label: filmName(recipe.filmId)
  }))
})

function filmName(id: number): string {
  return filmStore.films.find((film) => film.id === id)?.model ?? '未知胶片'
}

function developerName(id: number): string {
  return developerStore.developers.find((developer) => developer.id === id)?.name ?? '未知显影液'
}

function recipeName(id: number): string {
  const recipe = recipeStore.recipes.find((item) => item.id === id)
  if (!recipe) return '未知配方'
  return `${filmName(recipe.filmId)} · ${developerName(recipe.developerId)}`
}

onMounted(async () => {
  await Promise.all([
    filmStore.load(),
    developerStore.load(),
    recipeStore.load(),
    runStore.load()
  ])
})
</script>

<template>
  <section class="page-shell">
    <header class="page-hero">
      <div>
        <span class="eyebrow">DARKROOM INDEX</span>
        <h1>参数速查台</h1>
        <p>把胶片、显影液与实冲记录放在同一张工作台上，快速定位下一卷的起始参数。</p>
      </div>
      <div class="page-hero__stamp">20°C<br /><small>基准温度</small></div>
    </header>

    <div class="stat-strip">
      <StatBadge label="在册胶片" :value="filmStore.films.length" hint="按乳剂批次独立记录" tone="amber" />
      <StatBadge label="可用显影液" :value="developerStore.activeDevelopers.length" hint="不含已报废工作液" tone="cyan" />
      <StatBadge label="有效配方" :value="recipeStore.recipes.length" hint="覆盖黑白与彩色流程" />
      <StatBadge label="冲洗记录" :value="runStore.runs.length" hint="可用于回溯样片结果" tone="rose" />
    </div>

    <div class="lookup-grid">
      <div class="panel panel--wide">
        <div class="panel__head">
          <div>
            <h2>时间温度检索</h2>
            <p>组合胶片、稀释比与推拉档，右侧曲线显示当前温度选择。</p>
          </div>
          <button type="button" class="ghost-button" @click="resetFilters">重置筛选</button>
        </div>

        <div class="quick-filters">
          <label>
            <span>胶片</span>
            <select v-model="filmId">
              <option value="all">全部胶片</option>
              <option v-for="film in filmStore.films" :key="film.id" :value="film.id">
                {{ film.model }} · {{ film.format }} · {{ film.emulsionNo }}
              </option>
            </select>
          </label>
          <label>
            <span>稀释比</span>
            <select v-model="dilution">
              <option value="all">全部稀释比</option>
              <option value="1:1">1:1</option>
              <option value="1:3">1:3</option>
            </select>
          </label>
          <label>
            <span>推拉档</span>
            <select v-model="pushPull">
              <option value="all">全部档位</option>
              <option value="-1">拉档 -1</option>
              <option value="N">标准 N</option>
              <option value="+1">推档 +1</option>
              <option value="+2">推档 +2</option>
            </select>
          </label>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>胶片</th>
                <th>显影液</th>
                <th>稀释</th>
                <th>温度</th>
                <th>显影时间</th>
                <th>档位</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recipe in filteredRecipes" :key="recipe.id" @click="selectedTemp = recipe.tempC">
                <td>
                  <strong>{{ filmName(recipe.filmId) }}</strong>
                  <small>配方 #{{ recipe.id }}</small>
                </td>
                <td>{{ developerName(recipe.developerId) }}</td>
                <td>{{ recipe.dilution }}</td>
                <td>{{ recipe.tempC }}°C</td>
                <td>{{ recipe.devMinutes.toFixed(2) }} 分钟</td>
                <td><PushPullTag :value="recipe.pushPull" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredRecipes.length === 0" class="inline-empty">当前条件没有匹配配方，请放宽筛选。</div>
        </div>
      </div>

      <aside class="lookup-side">
        <TimeTempCurve
          :points="curvePoints"
          :selected-temp="selectedTemp"
          title="配方温度分布"
          @pick-temp="selectedTemp = $event"
        />

        <div class="panel recent-panel">
          <div class="panel__head">
            <div>
              <h2>最近冲洗</h2>
              <p>温度与结果形成下一批次的经验起点。</p>
            </div>
          </div>
          <article v-for="run in runStore.recentRuns" :key="run.id" class="run-brief">
            <div class="run-brief__top">
              <strong>{{ run.batchNo }}</strong>
              <span>{{ run.runDate }}</span>
            </div>
            <p>{{ recipeName(run.recipeId) }}</p>
            <div class="run-brief__meta">
              <span>{{ run.actualTempC }}°C</span>
              <span>{{ run.actualMinutes }} 分钟</span>
              <span>{{ run.tankType }}</span>
            </div>
            <small>{{ run.result }}</small>
          </article>
        </div>
      </aside>
    </div>
  </section>
</template>

