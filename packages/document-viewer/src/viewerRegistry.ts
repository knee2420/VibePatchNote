import type { ViewerDefinition } from './types';
import { PdfViewer } from './viewers/pdf/PdfViewer';
import { IframeFallbackViewer } from './viewers/fallback/IframeFallbackViewer';

export class ViewerRegistry {
  private registry = new Map<string, ViewerDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // PDF Viewer (Supports Horizontal Page Spread)
    this.register('pdf', {
      id: 'pdf',
      canSpread: true,
      component: PdfViewer,
    });

    // Fallback Web / Iframe Viewer
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
    // 1. Explicit fileType match
    if (fileType && this.registry.has(fileType.toLowerCase())) {
      return this.registry.get(fileType.toLowerCase())!;
    }

    // 2. Inferred from extension in URL or Title
    const targetString = urlOrTitle || '';
    const cleanPath = targetString.split('?')[0].toLowerCase();
    
    if (cleanPath.endsWith('.pdf')) {
      return this.registry.get('pdf')!;
    }

    // 3. Fallback
    return this.registry.get('default')!;
  }
}

export const viewerRegistry = new ViewerRegistry();
