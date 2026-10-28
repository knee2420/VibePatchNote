import type { ReactNode } from 'react';

/** 컨텍스트 주입 태그 모델 */
export interface ContextTagItem {
  id: string;
  type: 'section' | 'slot' | 'doc' | 'segment' | 'custom';
  label: string;
  detail?: string;
  icon?: ReactNode;
}

/** 프롬프트 레시피 프리셋 */
export interface RecipePresetItem {
  id: string;
  title: string;
  description?: string;
  promptTemplate: string;
  recommendedModel?: string;
}

/** 모델 실행 설정 */
export interface ModelConfig {
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

/** 컨텍스트 태그 바 Props */
export interface ContextTagBarProps {
  tags: ContextTagItem[];
  onRemoveTag?: (tagId: string) => void;
  onAddTagClick?: () => void;
  className?: string;
}

/** 모델 설정 뱃지 Props */
export interface ModelConfigBadgeProps {
  config: ModelConfig;
  availableModels?: string[];
  onChangeModel?: (modelName: string) => void;
  onChangeTemperature?: (temp: number) => void;
  className?: string;
}

/** 프롬프트 컴포저 Props */
export interface PromptComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (prompt: string, config: ModelConfig, contextTags: ContextTagItem[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  contextTags?: ContextTagItem[];
  onRemoveContextTag?: (tagId: string) => void;
  onAddContextTag?: () => void;
  modelConfig?: ModelConfig;
  onChangeModelConfig?: (config: ModelConfig) => void;
  availableModels?: string[];
  recipes?: RecipePresetItem[];
  onSelectRecipe?: (recipe: RecipePresetItem) => void;
  placeholder?: string;
  className?: string;
}
