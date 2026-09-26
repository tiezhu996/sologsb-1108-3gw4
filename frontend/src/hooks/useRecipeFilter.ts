import { storeToRefs } from 'pinia'
import { useRecipeStore } from '../stores/recipeStore'

export function useRecipeFilter() {
  const recipeStore = useRecipeStore()
  const {
    filterFilmId: filmId,
    filterDilution: dilution,
    filterPushPull: pushPull,
    filteredRecipes
  } = storeToRefs(recipeStore)

  function resetFilters(): void {
    recipeStore.filterFilmId = 'all'
    recipeStore.filterDilution = 'all'
    recipeStore.filterPushPull = 'all'
  }

  return {
    filmId,
    dilution,
    pushPull,
    filteredRecipes,
    resetFilters
  }
}
