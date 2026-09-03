import { pdfHandler } from './pdf';
import { textHandler } from './text';
import { imageHandler } from './image';

export { pdfHandler } from './pdf';
export { textHandler } from './text';
export { imageHandler } from './image';
export { defaultFallbackHandler } from './default';

export const defaultHandlers = [
  pdfHandler,
  textHandler,
  imageHandler,
];
