<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDeveloperStore } from './stores/developerStore'
import { useFilmStore } from './stores/filmStore'
import { useRecipeStore } from './stores/recipeStore'
import { useRunStore } from './stores/runStore'
import { downloadJson } from './utils/export'

const route = useRoute()
const filmStore = useFilmStore()
const developerStore = useDeveloperStore()
const recipeStore = useRecipeStore()
const runStore = useRunStore()

const navItems = [
  { path: '/', label: '参数速查' },
  { path: '/films', label: '胶片台账' },
  { path: '/developers', label: '显影液' },
  { path: '/recipes', label: '配方表' },
  { path: '/runs', label: '冲洗记录' }
]

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

function exportAll(): void {
  downloadJson(`gbfilmdev-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    schemaRev: 2,
    films: filmStore.films,
    developers: developerStore.developers,
    recipes: recipeStore.recipes,
    runs: runStore.runs
  })
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
  <div class="app-frame">
    <header class="topbar">
      <a class="brand" href="/" aria-label="返回参数速查台">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" role="img">
            <rect x="8" y="9" width="32" height="30" rx="4" />
            <circle cx="24" cy="24" r="8" />
            <path d="M13 9l3-4h16l3 4M17 34h14" />
          </svg>
        </span>
        <span>
          <strong>胶片冲洗参数库</strong>
          <small>GB FILM DEV</small>
        </span>
      </a>
      <nav aria-label="主导航">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          :class="{ active: isActive(item.path) }"
        >{{ item.label }}</a>
      </nav>
      <button type="button" class="export-button" @click="exportAll">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v3h14v-3" />
        </svg>
        导出数据
      </button>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="footer">
      <span>本地暗房资料库</span>
      <span>所有数据保存在当前浏览器</span>
    </footer>
  </div>
</template>
