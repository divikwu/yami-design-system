import {
  createContext,
  forwardRef,
  type ImgHTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ImageLoadingStrategy,
  ImageSource,
  ResponsiveImageSource,
} from "./image.types";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "./progressiveImage";

function isResponsiveImageSource(
  source: ImageSource,
): source is ResponsiveImageSource {
  return typeof source !== "string";
}

export function getImageSourceUrl(source: ImageSource): string {
  return typeof source === "string" ? source : source.src;
}

export function buildImageSrcSet(source: ResponsiveImageSource): string {
  const candidatesByWidth = new Map<number, string>();

  for (const candidate of [...source.candidates].sort(
    (left, right) => left.width - right.width,
  )) {
    if (candidate.width > 0 && !candidatesByWidth.has(candidate.width)) {
      candidatesByWidth.set(candidate.width, candidate.src);
    }
  }

  return Array.from(candidatesByWidth, ([width, src]) => `${src} ${width}w`).join(
    ", ",
  );
}

interface ResponsiveImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "srcSet" | "sizes" | "width" | "height"
  > {
  source: ImageSource;
  fallbackWidth?: number;
  fallbackHeight?: number;
  width?: number | string;
  height?: number | string;
  activateImmediately?: boolean;
  revealOnLoad?: boolean;
  onActivated?: () => void;
}

interface ImageLoadingWindowValue {
  strategy: ImageLoadingStrategy;
  rootRef?: RefObject<Element | null>;
}

const ImageLoadingWindowContext = createContext<ImageLoadingWindowValue>({
  strategy: "native",
});

export function ImageLoadingWindow({
  strategy,
  rootRef,
  children,
}: Partial<ImageLoadingWindowValue> & { children: ReactNode }) {
  const parent = useContext(ImageLoadingWindowContext);
  return (
    <ImageLoadingWindowContext.Provider
      value={{
        strategy: strategy ?? parent.strategy,
        rootRef: rootRef ?? parent.rootRef,
      }}
    >
      {children}
    </ImageLoadingWindowContext.Provider>
  );
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export function useWindowedImageActivation(activateImmediately = false) {
  const { strategy, rootRef } = useContext(ImageLoadingWindowContext);
  const [element, setElement] = useState<HTMLImageElement | null>(null);
  const [active, setActive] = useState(
    strategy !== "windowed" || activateImmediately,
  );

  useEffect(() => {
    if (strategy !== "windowed" || activateImmediately) {
      setActive(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    if (!element || !rootRef?.current) return;

    setActive(false);
    const rail = rootRef.current;
    const item = element.closest("[data-image-window-item]") ?? element;
    const itemWidth = Math.ceil(item.getBoundingClientRect().width);
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    const horizontalMargin = Math.max(0, Math.ceil(itemWidth + gap));
    let itemInHorizontalWindow = false;
    let railInViewport = false;
    const observers: IntersectionObserver[] = [];
    const activateWhenReady = () => {
      if (!itemInHorizontalWindow || !railInViewport) return;
      setActive(true);
      observers.forEach((observer) => observer.disconnect());
    };
    const horizontalObserver = new IntersectionObserver(
      (entries) => {
        itemInHorizontalWindow = entries.some((entry) => entry.isIntersecting);
        activateWhenReady();
      },
      {
        root: rail,
        rootMargin: `0px ${horizontalMargin}px`,
      },
    );
    const viewportObserver = new IntersectionObserver((entries) => {
      railInViewport = entries.some((entry) => entry.isIntersecting);
      activateWhenReady();
    });
    observers.push(horizontalObserver, viewportObserver);
    horizontalObserver.observe(item);
    viewportObserver.observe(rail);
    return () => observers.forEach((observer) => observer.disconnect());
  }, [activateImmediately, element, rootRef, strategy]);

  return {
    active,
    activationRef: setElement,
    windowed: strategy === "windowed",
  };
}

export const ResponsiveImage = forwardRef<
  HTMLImageElement,
  ResponsiveImageProps
>(function ResponsiveImage(
  {
    source,
    fallbackWidth,
    fallbackHeight,
    width,
    height,
    activateImmediately = false,
    revealOnLoad,
    onActivated,
    onLoad,
    onError,
    decoding = "async",
    ...rest
  },
  ref,
) {
  const responsive = isResponsiveImageSource(source);
  const sourceUrl = getImageSourceUrl(source);
  const srcSet = responsive ? buildImageSrcSet(source) : undefined;
  const { active, activationRef, windowed } = useWindowedImageActivation(
    activateImmediately,
  );
  const shouldRevealOnLoad = revealOnLoad ?? windowed;
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const imageRef = useCallback(
    (element: HTMLImageElement | null) => {
      imageElementRef.current = element;
      activationRef(element);
      setRef(ref, element);
      if (shouldRevealOnLoad) prepareProgressiveImage(element);
    },
    [activationRef, ref, shouldRevealOnLoad],
  );

  useEffect(() => {
    if (active) onActivated?.();
  }, [active, onActivated]);

  useEffect(() => {
    if (shouldRevealOnLoad) prepareProgressiveImage(imageElementRef.current);
  }, [active, shouldRevealOnLoad, sourceUrl, srcSet]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (shouldRevealOnLoad) handleProgressiveImageLoad(event);
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (shouldRevealOnLoad) handleProgressiveImageError(event);
    onError?.(event);
  };

  return (
    <img
      {...rest}
      ref={imageRef}
      src={active ? sourceUrl : undefined}
      srcSet={active ? srcSet || undefined : undefined}
      sizes={responsive ? source.sizes : undefined}
      width={responsive ? source.width : fallbackWidth ?? width}
      height={responsive ? source.height : fallbackHeight ?? height}
      decoding={decoding}
      onLoad={shouldRevealOnLoad || onLoad ? handleLoad : undefined}
      onError={shouldRevealOnLoad || onError ? handleError : undefined}
      data-image-loading-state={active ? "active" : "pending"}
    />
  );
});
