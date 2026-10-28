import type { ViewerDefinition } from './types';
import { PdfViewer } from './viewers/pdf/PdfViewer';
import { ImageViewer } from './viewers/image/ImageViewer';
import { IframeFallbackViewer } from './viewers/fallback/IframeFallbackViewer';

export class ViewerRegistry {
  private registry = new Map<string, ViewerDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // 1. PDF Viewer (Supports Horizontal Page Spread)
    this.register('pdf', {
      id: 'pdf',
      canSpread: true,
      component: PdfViewer,
    });

    // 2. Image Viewer (Supports Auto Aspect Ratio, No Scrollbar)
    this.register('image', {
      id: 'image',
      canSpread: false,
      component: ImageViewer,
    });

    // 3. Fallback Web / Iframe Viewer
    this.register('default', {
      id: 'default',
      canSpread: false,
      component: IframeFallbackViewer,
    });
  }

  public register(format: string, definition: ViewerDefinition): void {
    this.registry.set(format.toLowerCase(), definition);
  }

  public get(fileType?: string, urlOrTitle?: string): ViewerDefinition {
    // 1. Explicit fileType match (e.g. 'image', 'image/jpeg', 'pdf')
    if (fileType) {
      const normalizedType = fileType.toLowerCase();
      if (this.registry.has(normalizedType)) {
        return this.registry.get(normalizedType)!;
      }
      if (normalizedType.startsWith('image/')) {
        return this.registry.get('image')!;
      }
      if (normalizedType === 'application/pdf') {
        return this.registry.get('pdf')!;
      }
    }

    // 2. Inferred from extension in URL or Title
    const targetString = urlOrTitle || '';
    const cleanPath = targetString.split('?')[0].toLowerCase();

    if (cleanPath.endsWith('.pdf')) {
      return this.registry.get('pdf')!;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico'];
    if (imageExtensions.some((ext) => cleanPath.endsWith(ext))) {
      return this.registry.get('image')!;
    }

    // 3. Fallback
    return this.registry.get('default')!;
  }
}

export const viewerRegistry = new ViewerRegistry();
