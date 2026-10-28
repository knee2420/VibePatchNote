export interface RecipeReadiness { ready: boolean; missing: string[]; }
export interface RecipeRunAccepted { runId: string; status: string; }
export interface RecipeSourceAnchors { docId?: string; segmentArtifactId?: string; outlineArtifactId?: string; scaffoldId?: string; mappingFingerprint?: string; }

/** 근거 아티팩트는 식별자로만 참조한다. 사본은 담지 않는다. */
export interface RecipeProvenance {
  recipeId: string;
  revisionId: string;
  createdAt: string;
  /** `llm` 은 추출이 만든 최초 revision, `manual` 은 사람이 고친 revision. */
  origin: 'manual' | 'llm';
  runId?: string | null;
  traceId?: string | null;
  model?: string | null;
  promptHash?: string | null;
  engineVersion?: string | null;
  sourceAnchors: RecipeSourceAnchors;
}
export interface RecipeRevision { title: string; spec: Record<string, unknown>; provenance: RecipeProvenance; }
