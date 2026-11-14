export function previewBase(value?: string): string;
export function previewNumber(value: string | number): number;
export function joinBase(base: string, path: string): string;
export function prefixAbsolutePath(url: string, base: string): string;
export function prefixRootUrls(source: string, base: string): string;
export function rewriteCssUrls(css: string, base: string): string;

export interface PreviewManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
}

export interface PreviewManifest {
  start_url?: string;
  scope?: string;
  icons?: PreviewManifestIcon[];
  [key: string]: unknown;
}

export function rewriteManifest<T extends PreviewManifest>(manifest: T, base: string): T;
