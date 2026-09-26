<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DilutionInput from '../components/common/DilutionInput.vue'
import PushPullTag from '../components/common/PushPullTag.vue'
import TimeTempCurve from '../components/common/TimeTempCurve.vue'
import { calculateCompensatedMinutes, useTempCompensate } from '../hooks/useTempCompensate'
import { useRecipeFilter } from '../hooks/useRecipeFilter'
import { useDeveloperStore } from '../stores/developerStore'
import { useFilmStore } from '../stores/filmStore'
import { useRecipeStore } from '../stores/recipeStore'
import type { Developer, Dilution } from '../types/developer'
import type { DevRecipe, PushPull } from '../types/dev-recipe'

interface RecipeForm {
  filmId: number
  developerId: number
  dilution: Dilution
  tempC: number
  devMinutes: number
  agitation: string
  stopBath: string
  fixer: string
  washMinutes: number
  pushPull: PushPull
  note: string
}

const filmStore = useFilmStore()
const developerStore = useDeveloperStore()
const recipeStore = useRecipeStore()
const { filmId, dilution, pushPull, filteredRecipes, resetFilters } = useRecipeFilter()
const showForm = ref(false)
const saving = ref(false)
const sampleWorkingVolume = ref(300)
const referenceTemp = computed(() => filteredRecipes.value[0]?.tempC ?? 20)
const { actualTempC, suggest } = useTempCompensate(referenceTemp)

watch(referenceTemp, (value) => {
  actualTempC.value = value
}, { immediate: true })

const form = reactive<RecipeForm>({
  filmId: 1,
  developerId: 1,
  dilution: '1:1',
  tempC: 20,
  devMinutes: 8,
  agitation: '每 30s 摇 5s',
  stopBath: '酸性停显 1 分钟',
  fixer: '快速定影 5 分钟',
  washMinutes: 10,
  pushPull: 'N',
  note: ''
})

const curvePoints = computed(() => {
  const recipe = filteredRecipes.value[0]
  if (!recipe) return []
  return Array.from({ length: 13 }, (_, index) => {
    const temp = Math.round((recipe.tempC - 3 + index * 0.5) * 10) / 10
    return {
      tempC: temp,
      minutes: calculateCompensatedMinutes(recipe.devMinutes, temp, recipe.tempC)
    }
  })
})

function filmLabel(id: number): string {
  const film = filmStore.films.find((item) => item.id === id)
  return film ? `${film.model} · ${film.format} · ${film.emulsionNo}` : '未知胶片'
}

function developerLabel(id: number): string {
  const developer = developerStore.developers.find((item) => item.id === id)
  return developer ? `${developer.name} · ${developer.category}` : '未知显影液'
}

function suggestedFor(recipe: { devMinutes: number; tempC: number }): number {
  return suggest(recipe.devMinutes, actualTempC.value).minutes
}

function pickCurveTemp(temp: number): void {
  actualTempC.value = temp
}

function deriveRecipe(recipe: DevRecipe): void {
  form.filmId = recipe.filmId
  form.developerId = recipe.developerId
  form.dilution = recipe.dilution
  form.tempC = recipe.tempC
  form.devMinutes = recipe.devMinutes
  form.agitation = recipe.agitation
  form.stopBath = recipe.stopBath
  form.fixer = recipe.fixer
  form.washMinutes = recipe.washMinutes
  form.pushPull = recipe.pushPull
  form.note = `派生自配方 #${recipe.id ?? '原记录'}${recipe.note ? `：${recipe.note}` : ''}`
  showForm.value = true
}

async function submitRecipe(): Promise<void> {
  if (!form.filmId || !form.developerId || !form.devMinutes) {
    ElMessage.warning('请选择胶片、显影液并填写显影时间')
    return
  }
  saving.value = true
  try {
    await recipeStore.addRecipe({
      filmId: Number(form.filmId),
      developerId: Number(form.developerId),
      dilution: form.dilution,
      tempC: Number(form.tempC),
      devMinutes: Number(form.devMinutes),
      agitation: form.agitation.trim() || '每 30s 摇 5s',
      stopBath: form.stopBath.trim() || '酸性停显 1 分钟',
      fixer: form.fixer.trim() || '快速定影 5 分钟',
      washMinutes: Number(form.washMinutes),
      pushPull: form.pushPull,
      note: form.note.trim()
    })
    ElMessage.success('冲洗配方已保存')
    form.note = ''
    showForm.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([filmStore.load(), developerStore.load(), recipeStore.load()])
  if (filmStore.films[0]?.id !== undefined) form.filmId = filmStore.films[0].id
  const usableDeveloper = developerStore.developers.find((item: Developer) => item.state !== '报废')
  if (usableDeveloper?.id !== undefined) form.developerId = usableDeveloper.id
})
</script>

<template>
  <section class="page-shell">
    <header class="page-hero page-hero--compact">
      <div>
        <span class="eyebrow">PROCESS RECIPES</span>
        <h1>配方表</h1>
        <p>按胶片与稀释比编排显影流程，调整实测温度时即时折算时间并读取补偿曲线。</p>
      </div>
      <button type="button" class="primary-button" data-testid="new-recipe" @click="showForm = !showForm">
        {{ showForm ? '收起表单' : '新建配方' }}
      </button>
    </header>

    <form v-if="showForm" class="inline-form" data-testid="form-recipe" @submit.prevent="submitRecipe">
      <div class="inline-form__head">
        <div>
          <h2>编排冲洗配方</h2>
          <p>温度与时间先记录基准值，滚动时间可在记录页按本次条件修正。</p>
        </div>
      </div>
      <div class="form-grid form-grid--four">
        <label class="span-2">
          <span>胶片</span>
          <select v-model.number="form.filmId" data-testid="field-filmId">
            <option v-for="film in filmStore.films" :key="film.id" :value="film.id">
              {{ filmLabel(film.id ?? 0) }}
            </option>
          </select>
        </label>
        <label class="span-2">
          <span>显影液</span>
          <select v-model.number="form.developerId" data-testid="field-developerId">
            <option v-for="developer in developerStore.developers" :key="developer.id" :value="developer.id">
              {{ developerLabel(developer.id ?? 0) }}
            </option>
          </select>
        </label>
        <div class="span-2">
          <DilutionInput
            v-model:ratio="form.dilution"
            v-model:working-volume-ml="sampleWorkingVolume"
            ratio-test-id="field-dilution"
            volume-test-id="field-workingVolumeMl"
          />
        </div>
        <label>
          <span>显影温度</span>
          <input v-model.number="form.tempC" data-testid="field-tempC" type="number" min="15" max="45" step="0.5" />
        </label>
        <label>
          <span>显影时间</span>
          <input v-model.number="form.devMinutes" data-testid="field-devMinutes" type="number" min="0.5" max="60" step="0.25" />
        </label>
        <label>
          <span>摇罐方式</span>
          <input v-model="form.agitation" data-testid="field-agitation" type="text" />
        </label>
        <label>
          <span>停显</span>
          <input v-model="form.stopBath" data-testid="field-stopBath" type="text" />
        </label>
        <label class="span-2">
          <span>定影</span>
          <input v-model="form.fixer" data-testid="field-fixer" type="text" />
        </label>
        <label>
          <span>水洗分钟</span>
          <input v-model.number="form.washMinutes" data-testid="field-washMinutes" type="number" min="1" max="60" />
        </label>
        <label>
          <span>推拉档</span>
          <select v-model="form.pushPull" data-testid="field-pushPull">
            <option value="-1">拉档 -1</option>
            <option value="N">标准 N</option>
            <option value="+1">推档 +1</option>
            <option value="+2">推档 +2</option>
          </select>
        </label>
        <label class="span-4">
          <span>经验注释</span>
          <input v-model="form.note" data-testid="field-note" type="text" placeholder="记录新批次需要留意的曝光或密度特点" />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="ghost-button" @click="showForm = false">取消</button>
        <button type="submit" class="primary-button" data-testid="submit-recipe" :disabled="saving">
          {{ saving ? '保存中…' : '保存配方' }}
        </button>
      </div>
    </form>

    <div class="panel recipe-toolbar">
      <div class="quick-filters">
        <label>
          <span>胶片</span>
          <select v-model="filmId">
            <option value="all">全部胶片</option>
            <option v-for="film in filmStore.films" :key="film.id" :value="film.id">{{ film.model }} · {{ film.emulsionNo }}</option>
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
        <label>
          <span>查看温度</span>
          <input v-model.number="actualTempC" type="number" min="15" max="45" step="0.5" />
        </label>
      </div>
      <button type="button" class="ghost-button" @click="resetFilters">重置筛选</button>
    </div>

    <div class="recipe-layout">
      <div class="panel">
        <div class="panel__head">
          <div>
            <h2>配方清单</h2>
            <p>当前筛选显示 {{ filteredRecipes.length }} 条，共 {{ recipeStore.recipes.length }} 条。</p>
          </div>
          <span class="count-pill">配方数 <strong data-testid="count-recipe">{{ recipeStore.recipes.length }}</strong></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>胶片 / 显影液</th>
                <th>基准</th>
                <th>查看温度折算</th>
                <th>推拉档</th>
                <th>后处理</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recipe in filteredRecipes" :key="recipe.id" data-testid="row-recipe">
                <td>
                  <strong>{{ filmLabel(recipe.filmId) }}</strong>
                  <small>{{ developerLabel(recipe.developerId) }} · {{ recipe.dilution }}</small>
                  <em v-if="recipe.note">{{ recipe.note }}</em>
                </td>
                <td>{{ recipe.tempC }}°C / {{ recipe.devMinutes.toFixed(2) }} 分钟</td>
                <td>
                  <strong class="accent-number">{{ suggestedFor(recipe).toFixed(2) }} 分钟</strong>
                  <small>{{ actualTempC }}°C 实测温度</small>
                </td>
                <td><PushPullTag :value="recipe.pushPull" show-hint /></td>
                <td>
                  <span>{{ recipe.agitation }}</span>
                  <small>{{ recipe.stopBath }} · {{ recipe.fixer }} · 水洗 {{ recipe.washMinutes }} 分钟</small>
                  <button type="button" class="text-button" @click="deriveRecipe(recipe)">复制派生</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredRecipes.length === 0" class="inline-empty">没有匹配配方，重置筛选或新建一条。</div>
        </div>
      </div>

      <aside>
        <TimeTempCurve
          :points="curvePoints"
          :selected-temp="actualTempC"
          title="时间补偿曲线"
          @pick-temp="pickCurveTemp"
        />
        <div class="panel formula-note">
          <h2>补偿模型</h2>
          <p>以配方自身温度为基准，每升高 1°C 将显影时间乘 0.9；每降低 1°C 则乘 1.1。</p>
          <strong>{{ actualTempC }}°C · 建议 {{ suggest(filteredRecipes[0]?.devMinutes ?? 0, actualTempC).minutes.toFixed(2) }} 分钟</strong>
        </div>
      </aside>
    </div>
  </section>
</template>
