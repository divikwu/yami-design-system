export interface ImageCandidate {
  src: string;
  width: number;
}

export interface ResponsiveImageSource {
  src: string;
  width: number;
  height: number;
  candidates: readonly ImageCandidate[];
  sizes: string;
}

export type ImageSource = string | ResponsiveImageSource;

export type ImageLoadingStrategy = "native" | "windowed";
