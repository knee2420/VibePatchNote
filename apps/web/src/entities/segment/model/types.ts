export interface SegmentData extends Record<string, unknown> {
  title: string;
  content: string;
  isMasking?: boolean; // AI masking flag
}
