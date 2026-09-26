import { createRouter, createWebHistory } from 'vue-router'
import RecipeLookup from '../pages/RecipeLookup.vue'
import FilmStockList from '../pages/FilmStockList.vue'
import DeveloperList from '../pages/DeveloperList.vue'
import RecipeTable from '../pages/RecipeTable.vue'
import DevRunList from '../pages/DevRunList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'lookup', component: RecipeLookup },
    { path: '/films', name: 'films', component: FilmStockList },
    { path: '/developers', name: 'developers', component: DeveloperList },
    { path: '/recipes', name: 'recipes', component: RecipeTable },
    { path: '/runs', name: 'runs', component: DevRunList },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

export default router
