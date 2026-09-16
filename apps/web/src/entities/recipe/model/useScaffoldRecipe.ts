import { useEffect, useState } from 'react';

import { recipeApi } from '../api/recipeApi';
import type { RecipeRevision } from './types';

interface UseScaffoldRecipeReturn {
  recipe: RecipeRevision | null;
  isLoading: boolean;
  setRecipe: (recipe: RecipeRevision | null) => void;
  reload: () => Promise<void>;
}

/**
 * 문서 ID(docId) 또는 스캐폴드 ID(scaffoldId)에 매핑된 최신 Recipe(저작 규격)를 조회하는 훅.
 */
export function useScaffoldRecipe(
  scaffoldId?: string,
  docId?: string
): UseScaffoldRecipeReturn {
  const [recipe, setRecipe] = useState<RecipeRevision | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(scaffoldId || docId));

  const loadRecipe = async () => {
    if (!docId && !scaffoldId) {
      setRecipe(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let found: RecipeRevision | null = null;

      // 1. docId 최우선 조회
      if (docId) {
        const docItems = await recipeApi.listByDocument(docId).catch(() => []);
        if (docItems.length > 0) {
          found = docItems.reduce<RecipeRevision | null>(
            (newest, item) =>
              !newest || item.recipe.provenance.createdAt > newest.provenance.createdAt
                ? item.recipe
                : newest,
            null
          );
        }
      }

      // 2. scaffoldId 조회
      if (!found && scaffoldId) {
        const scaffoldItems = await recipeApi.listByScaffold(scaffoldId).catch(() => []);
        if (scaffoldItems.length > 0) {
          found = scaffoldItems.reduce<RecipeRevision | null>(
            (newest, item) =>
              !newest || item.recipe.provenance.createdAt > newest.provenance.createdAt
                ? item.recipe
                : newest,
            null
          );
        }
      }

      setRecipe(found);
    } catch (err) {
      console.error('[useScaffoldRecipe] Failed to load recipe revision:', err);
      setRecipe(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRecipe();
  }, [scaffoldId, docId]);

  return {
    recipe,
    isLoading,
    setRecipe,
    reload: loadRecipe,
  };
}
