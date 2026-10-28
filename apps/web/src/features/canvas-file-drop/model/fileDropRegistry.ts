import type { FileDropHandler } from './types';
import { defaultFallbackHandler, defaultHandlers } from './handlers';

export class FileDropRegistry {
  private handlers = new Map<string, FileDropHandler>();
  private defaultHandler: FileDropHandler | null = null;

  constructor() {
    this.initDefaultHandlers();
  }

  register(handler: FileDropHandler): void {
    this.handlers.set(handler.id, handler);
  }

  unregister(id: string): void {
    this.handlers.delete(id);
  }

  setDefaultHandler(handler: FileDropHandler | null): void {
    this.defaultHandler = handler;
  }

  getHandler(file: File): FileDropHandler | undefined {
    const fileName = file.name || '';
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
    const mimeType = file.type?.toLowerCase() || '';

    for (const handler of this.handlers.values()) {
      if (ext && handler.extensions.includes(ext)) {
        return handler;
      }
      if (mimeType && handler.mimeTypes && handler.mimeTypes.includes(mimeType)) {
        return handler;
      }
    }

    return this.defaultHandler ?? undefined;
  }

  getAllHandlers(): FileDropHandler[] {
    return Array.from(this.handlers.values());
  }

  getAllSupportedExtensions(): string[] {
    const extSet = new Set<string>();
    for (const handler of this.handlers.values()) {
      handler.extensions.forEach((ext) => extSet.add(ext));
    }
    return Array.from(extSet);
  }

  private initDefaultHandlers(): void {
    for (const handler of defaultHandlers) {
      this.register(handler);
    }
    this.setDefaultHandler(defaultFallbackHandler);
  }
}

export const fileDropRegistry = new FileDropRegistry();
