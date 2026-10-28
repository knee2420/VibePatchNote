/** 문서 메타데이터 모델 */
export interface DocumentMetadata {
  status?: string;
  label?: string;
  targetWordCount?: number;
  currentWordCount?: number;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, string>;
}

/** 메타데이터 인스펙터 패널 Props */
export interface MetadataInspectorProps {
  metadata: DocumentMetadata;
  onChange?: (updated: DocumentMetadata) => void;
  statusOptions?: string[];
  labelOptions?: string[];
  className?: string;
}
