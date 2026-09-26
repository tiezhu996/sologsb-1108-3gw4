<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import EmptyPanel from '../components/common/EmptyPanel.vue'
import FilterBar from '../components/common/FilterBar.vue'
import { useFilmStore } from '../stores/filmStore'
import type { FilmFormat, FilmModel } from '../types/film-stock'

interface FilterValue {
  keyword: string
  selections: Record<string, string[]>
}

interface FilmForm {
  model: FilmModel
  format: FilmFormat
  boxIso: number
  realIso: number
  emulsionNo: string
  expireDate: string
  rollsLeft: number
}

const route = useRoute()
const filmStore = useFilmStore()
const showForm = ref(false)
const saving = ref(false)

const querySelections = (key: string): string[] => {
  const value = route.query[key]
  return typeof value === 'string' && value ? value.split(',') : []
}

const filterValue = ref<FilterValue>({
  keyword: typeof route.query.q === 'string' ? route.query.q : '',
  selections: {
    format: querySelections('format'),
    expiry: querySelections('expiry')
  }
})

const form = reactive<FilmForm>({
  model: 'GP3',
  format: '135',
  boxIso: 100,
  realIso: 100,
  emulsionNo: '',
  expireDate: '2028-12-31',
  rollsLeft: 1
})

const filteredFilms = computed(() => {
  const keyword = filterValue.value.keyword.trim().toLowerCase()
  const formats = filterValue.value.selections.format ?? []
  const expiries = filterValue.value.selections.expiry ?? []
  const today = new Date()
  const compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const inThreeMonths = new Date(compareDate)
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3)
  const inSixMonths = new Date(compareDate)
  inSixMonths.setMonth(inSixMonths.getMonth() + 6)

  return filmStore.films.filter((film) => {
    const matchesKeyword = !keyword
      || film.model.toLowerCase().includes(keyword)
      || film.emulsionNo.toLowerCase().includes(keyword)
    const matchesFormat = formats.length === 0 || formats.includes(film.format)
    const expiryDate = new Date(`${film.expireDate}T23:59:59`)
    const matchesExpiry = expiries.length === 0 || expiries.some((expiry) => (
      (expiry === '已过期' && expiryDate < compareDate)
      || (expiry === '3 个月内' && expiryDate >= compareDate && expiryDate <= inThreeMonths)
      || (expiry === '6 个月内' && expiryDate >= compareDate && expiryDate <= inSixMonths)
      || (expiry === '6 个月以上' && expiryDate > inSixMonths)
    ))
    return matchesKeyword && matchesFormat && matchesExpiry
  })
})

function expiryState(expireDate: string): { label: string; className: string } {
  const date = new Date(`${expireDate}T23:59:59`)
  const now = new Date()
  const sooner = new Date(now)
  sooner.setMonth(sooner.getMonth() + 3)
  if (date < now) return { label: '已过期', className: 'status--danger' }
  if (date <= sooner) return { label: '临期', className: 'status--warning' }
  return { label: '有效', className: 'status--ok' }
}

function stockStatus(film: { rollsLeft: number; expireDate: string }): { label: string; className: string } {
  if (film.rollsLeft === 0) return { label: '缺货', className: 'status--danger' }
  return expiryState(film.expireDate)
}

async function submitFilm(): Promise<void> {
  const models: FilmModel[] = ['GP3', 'HP5', 'Portra']
  const formats: FilmFormat[] = ['135', '120', '4×5']
  if (!models.includes(form.model) || !formats.includes(form.format)) {
    ElMessage.warning('胶片型号或画幅不在支持范围内')
    return
  }
  if (!form.emulsionNo.trim() || !form.expireDate) {
    ElMessage.warning('请填写完整乳剂批号与有效期')
    return
  }
  saving.value = true
  try {
    await filmStore.addFilm({ ...form, emulsionNo: form.emulsionNo.trim() })
    ElMessage.success('胶片批次已入册')
    form.emulsionNo = ''
    form.rollsLeft = 1
    showForm.value = false
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void filmStore.load()
})
</script>

<template>
  <section class="page-shell">
    <header class="page-hero page-hero--compact">
      <div>
        <span class="eyebrow">FILM LEDGER</span>
        <h1>胶片型号与乳剂批次台账</h1>
        <p>同型号不同乳剂批次分别建卡，余量低于两卷时进入补货观察。</p>
      </div>
      <button type="button" class="primary-button" data-testid="new-film" @click="showForm = !showForm">
        {{ showForm ? '收起表单' : '新建胶片' }}
      </button>
    </header>

    <div class="stat-strip">
      <div class="simple-stat"><span>总余量</span><strong>{{ filmStore.totalRolls }}</strong><small>卷</small></div>
      <div class="simple-stat"><span>低余量批次</span><strong>{{ filmStore.lowStockCount }}</strong><small>条</small></div>
      <div class="simple-stat"><span>筛选结果</span><strong data-testid="count-film">{{ filteredFilms.length }}</strong><small>条</small></div>
    </div>

    <form v-if="showForm" class="inline-form" data-testid="form-film" @submit.prevent="submitFilm">
      <div class="inline-form__head">
        <div>
          <h2>登记新胶片批次</h2>
          <p>批次号用于区分不同乳剂特性，请按包装实际信息填写。</p>
        </div>
      </div>
      <div class="form-grid form-grid--four">
        <label>
          <span>胶片型号</span>
          <input v-model="form.model" data-testid="field-model" type="text" list="film-model-options" />
          <datalist id="film-model-options">
            <option value="GP3"></option>
            <option value="HP5"></option>
            <option value="Portra"></option>
          </datalist>
        </label>
        <label>
          <span>画幅</span>
          <input v-model="form.format" data-testid="field-format" type="text" list="film-format-options" />
          <datalist id="film-format-options">
            <option value="135"></option>
            <option value="120"></option>
            <option value="4×5"></option>
          </datalist>
        </label>
        <label>
          <span>标称 ISO</span>
          <input v-model.number="form.boxIso" data-testid="field-boxIso" type="number" min="25" max="3200" />
        </label>
        <label>
          <span>实拍 ISO</span>
          <input v-model.number="form.realIso" data-testid="field-realIso" type="number" min="25" max="3200" />
        </label>
        <label class="span-2">
          <span>乳剂批号</span>
          <input v-model="form.emulsionNo" data-testid="field-emulsionNo" type="text" placeholder="如 GP3-2504-A17" />
        </label>
        <label>
          <span>有效期</span>
          <input v-model="form.expireDate" data-testid="field-expireDate" type="date" />
        </label>
        <label>
          <span>剩余卷数</span>
          <input v-model.number="form.rollsLeft" data-testid="field-rollsLeft" type="number" min="0" max="99" />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="ghost-button" @click="showForm = false">取消</button>
        <button type="submit" class="primary-button" data-testid="submit-film" :disabled="saving">
          {{ saving ? '保存中…' : '保存批次' }}
        </button>
      </div>
    </form>

    <FilterBar
      v-model="filterValue"
      :fields="[
        { key: 'format', label: '画幅', options: ['135', '120', '4×5'] },
        { key: 'expiry', label: '有效期', options: ['已过期', '3 个月内', '6 个月内', '6 个月以上'] }
      ]"
    />

    <div v-if="filteredFilms.length" class="card-list">
      <article v-for="film in filteredFilms" :key="film.id" class="entity-card film-card" data-testid="row-film">
        <div class="film-card__badge">{{ film.model }}</div>
        <div class="entity-card__main">
          <div class="entity-card__title">
            <h2>{{ film.model }} · {{ film.format }}</h2>
            <span class="status-chip" :class="stockStatus(film).className">
              {{ stockStatus(film).label }}
            </span>
          </div>
          <dl class="data-pairs">
            <div><dt>乳剂批号</dt><dd>{{ film.emulsionNo }}</dd></div>
            <div><dt>标称 / 实拍</dt><dd>ISO {{ film.boxIso }} / {{ film.realIso }}</dd></div>
            <div><dt>有效期</dt><dd>{{ film.expireDate }}</dd></div>
            <div><dt>余量</dt><dd :class="{ 'text-danger': film.rollsLeft <= 2 }">{{ film.rollsLeft }} 卷</dd></div>
          </dl>
        </div>
      </article>
    </div>
    <EmptyPanel v-else title="没有符合条件的胶片" description="改变画幅、有效期条件，或登记一个新乳剂批次。" />
  </section>
</template>
