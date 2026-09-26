<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface FilterField {
  key: string
  label: string
  options: string[]
}

interface FilterValue {
  keyword: string
  selections: Record<string, string[]>
}

const props = defineProps<{
  fields: FilterField[]
  modelValue: FilterValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValue]
}>()

const route = useRoute()
const router = useRouter()
const keyword = ref(props.modelValue.keyword)
const selections = reactive<Record<string, string[]>>(
  Object.fromEntries(props.fields.map((field) => [field.key, [...(props.modelValue.selections[field.key] ?? [])]]))
)

watch(() => props.modelValue, (value) => {
  keyword.value = value.keyword
  props.fields.forEach((field) => {
    selections[field.key] = [...(value.selections[field.key] ?? [])]
  })
}, { deep: true })

function emitValue(): void {
  const value: FilterValue = {
    keyword: keyword.value,
    selections: Object.fromEntries(
      props.fields.map((field) => [field.key, [...(selections[field.key] ?? [])]])
    )
  }
  const query: Record<string, string> = {}
  Object.entries(route.query).forEach(([key, value]) => {
    if (typeof value === 'string') query[key] = value
    else if (Array.isArray(value)) query[key] = value.filter((item): item is string => item !== null).join(',')
  })
  query.q = keyword.value
  props.fields.forEach((field) => {
    const current = selections[field.key] ?? []
    if (current.length > 0) query[field.key] = current.join(',')
    else delete query[field.key]
  })
  emit('update:modelValue', value)
  void router.replace({ query })
}

function reset(): void {
  keyword.value = ''
  props.fields.forEach((field) => {
    selections[field.key] = []
  })
  emitValue()
}
</script>

<template>
  <div class="filter-bar">
    <label class="filter-bar__keyword">
      <span>关键字</span>
      <input v-model="keyword" type="search" placeholder="型号、批号或评价" @input="emitValue" />
    </label>
    <label v-for="field in fields" :key="field.key">
      <span>{{ field.label }}</span>
      <select v-model="selections[field.key]" multiple @change="emitValue">
        <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
      </select>
    </label>
    <button type="button" class="filter-bar__reset" @click="reset">清除筛选</button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 247, 0.86);
}

.filter-bar label {
  display: grid;
  gap: 5px;
  color: var(--ink-soft);
  font-size: 12px;
}

.filter-bar__keyword {
  flex: 1 1 210px;
}

.filter-bar input,
.filter-bar select {
  min-width: 150px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  color: var(--ink);
  background: #fffdf9;
  outline: none;
}

.filter-bar select {
  min-height: 38px;
}

.filter-bar input:focus,
.filter-bar select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(181, 102, 39, 0.1);
}

.filter-bar__reset {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  color: var(--ink-soft);
  background: transparent;
  cursor: pointer;
}

.filter-bar__reset:hover {
  color: var(--ink);
  background: #f4eadc;
}
</style>
