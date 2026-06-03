import { RefObject, useEffect } from 'react';

type AutoCloseEvent = PointerEvent | FocusEvent | KeyboardEvent | Event;

interface UseAutoCloseOptions {
  enabled: boolean;
  refs: Array<RefObject<HTMLElement | null>>;
  onClose: () => void;
  idleMs?: number;
  closeOnEscape?: boolean;
}

const activityEvents = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'] as const;

function isInsideRef(target: EventTarget | null, refs: Array<RefObject<HTMLElement | null>>) {
  return refs.some((ref) => {
    const node = ref.current;
    return node && target instanceof Node && node.contains(target);
  });
}

export function useAutoClose({
  enabled,
  refs,
  onClose,
  idleMs = 12000,
  closeOnEscape = true
}: UseAutoCloseOptions) {
  useEffect(() => {
    if (!enabled) return undefined;

    let idleTimer: number | undefined;

    const clearIdleTimer = () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = undefined;
      }
    };

    const scheduleIdleClose = () => {
      clearIdleTimer();
      if (idleMs > 0) {
        idleTimer = window.setTimeout(onClose, idleMs);
      }
    };

    const closeFromOutside = (event: AutoCloseEvent) => {
      if (!isInsideRef(event.target, refs)) {
        onClose();
      }
    };

    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    const resetIdleTimer = (event: Event) => {
      if (isInsideRef(event.target, refs)) {
        scheduleIdleClose();
      }
    };

    scheduleIdleClose();
    document.addEventListener('pointerdown', closeFromOutside, true);
    document.addEventListener('focusin', closeFromOutside, true);
    document.addEventListener('keydown', closeFromKeyboard, true);
    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, resetIdleTimer, true);
    });

    return () => {
      clearIdleTimer();
      document.removeEventListener('pointerdown', closeFromOutside, true);
      document.removeEventListener('focusin', closeFromOutside, true);
      document.removeEventListener('keydown', closeFromKeyboard, true);
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, resetIdleTimer, true);
      });
    };
  }, [closeOnEscape, enabled, idleMs, onClose, refs]);
}
