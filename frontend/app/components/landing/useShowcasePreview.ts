import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { EASE } from "~/lib/animation";

const SCROLL_IDLE_MS = 100;

interface PreviewCandidate {
  element: HTMLAnchorElement;
  previewSrc: string;
}

export function useShowcasePreview(
  previewRef: RefObject<HTMLDivElement | null>,
  initialPreviewSrc: string,
) {
  const pointerCandidate = useRef<PreviewCandidate | null>(null);
  const focusCandidate = useRef<PreviewCandidate | null>(null);
  const visiblePreviewSrc = useRef<string | null>(null);
  const isScrolling = useRef(false);
  const scrollIdleTimer = useRef<number | null>(null);
  const moveX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const moveY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const [previewSrc, setPreviewSrc] = useState(initialPreviewSrc);

  const hasFinePointer = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    [],
  );

  const showPreview = useCallback(
    (src: string) => {
      const preview = previewRef.current;
      if (!preview || !hasFinePointer() || visiblePreviewSrc.current === src) {
        return;
      }

      setPreviewSrc((current) => (current === src ? current : src));
      visiblePreviewSrc.current = src;
      gsap.to(preview, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.35,
        ease: EASE.out,
        overwrite: "auto",
      });
    },
    [hasFinePointer, previewRef],
  );

  const hidePreview = useCallback(() => {
    const preview = previewRef.current;
    if (!preview || visiblePreviewSrc.current === null) return;

    visiblePreviewSrc.current = null;
    gsap.to(preview, {
      autoAlpha: 0,
      scale: 0.9,
      duration: 0.25,
      overwrite: "auto",
    });
  }, [previewRef]);

  const reconcilePreview = useCallback(() => {
    if (isScrolling.current) {
      hidePreview();
      return;
    }

    const pointer = pointerCandidate.current;
    if (
      pointer?.element.isConnected &&
      pointer.element.matches(":hover")
    ) {
      showPreview(pointer.previewSrc);
      return;
    }
    pointerCandidate.current = null;

    const focused = focusCandidate.current;
    if (
      focused?.element.isConnected &&
      typeof document !== "undefined" &&
      focused.element === document.activeElement
    ) {
      showPreview(focused.previewSrc);
      return;
    }
    focusCandidate.current = null;
    hidePreview();
  }, [hidePreview, showPreview]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    moveX.current = gsap.quickTo(preview, "x", {
      duration: 0.35,
      ease: "power3.out",
    });
    moveY.current = gsap.quickTo(preview, "y", {
      duration: 0.35,
      ease: "power3.out",
    });

    return () => {
      moveX.current = null;
      moveY.current = null;
      gsap.killTweensOf(preview);
    };
  }, [previewRef]);

  useEffect(() => {
    const handleScroll = () => {
      isScrolling.current = true;
      focusCandidate.current = null;
      hidePreview();

      if (scrollIdleTimer.current !== null) {
        window.clearTimeout(scrollIdleTimer.current);
      }
      scrollIdleTimer.current = window.setTimeout(() => {
        scrollIdleTimer.current = null;
        isScrolling.current = false;
        reconcilePreview();
      }, SCROLL_IDLE_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollIdleTimer.current !== null) {
        window.clearTimeout(scrollIdleTimer.current);
        scrollIdleTimer.current = null;
      }
    };
  }, [hidePreview, reconcilePreview]);

  const handleMouseMove = (event: MouseEvent<HTMLUListElement>) => {
    if (!hasFinePointer()) return;
    moveX.current?.(event.clientX + 24);
    moveY.current?.(event.clientY - 120);
  };

  const handlePointerEnter = (
    event: MouseEvent<HTMLAnchorElement>,
    src: string,
  ) => {
    pointerCandidate.current = {
      element: event.currentTarget,
      previewSrc: src,
    };
    if (!isScrolling.current) showPreview(src);
  };

  const handlePointerLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pointerCandidate.current?.element === event.currentTarget) {
      pointerCandidate.current = null;
    }
    reconcilePreview();
  };

  const handleListLeave = () => {
    pointerCandidate.current = null;
    reconcilePreview();
  };

  const handleFocus = (
    event: FocusEvent<HTMLAnchorElement>,
    src: string,
  ) => {
    focusCandidate.current = {
      element: event.currentTarget,
      previewSrc: src,
    };
    if (!isScrolling.current) showPreview(src);
  };

  const handleBlur = (event: FocusEvent<HTMLAnchorElement>) => {
    if (focusCandidate.current?.element === event.currentTarget) {
      focusCandidate.current = null;
    }
    reconcilePreview();
  };

  return {
    handleBlur,
    handleFocus,
    handleListLeave,
    handleMouseMove,
    handlePointerEnter,
    handlePointerLeave,
    previewSrc,
  };
}
