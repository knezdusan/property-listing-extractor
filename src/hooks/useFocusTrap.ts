import { RefObject } from "react";

/**
 * Custom hook to trap focus within a specified element
 * Prevents tabbing outside of the element when it's active (e.g., modal dialogs)
 *
 * @param elementRef - React ref to the element that should trap focus
 * @returns A function to handle keyboard events and trap focus
 */
export function useFocusTrap<T extends HTMLElement>(elementRef: RefObject<T | null>) {
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === "Tab" && elementRef.current) {
      // Get all focusable elements inside the element
      const focusableElements = elementRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Convert NodeList to Array for easier handling
      const focusableArray = Array.from(focusableElements);

      // If no focusable elements, do nothing
      if (focusableArray.length === 0) return;

      const firstElement = focusableArray[0] as HTMLElement;
      const lastElement = focusableArray[focusableArray.length - 1] as HTMLElement;

      const tabForwards = !e.shiftKey && document.activeElement === lastElement;
      const tabBackwards = e.shiftKey && document.activeElement === firstElement;

      if (tabForwards) {
        e.preventDefault();
        firstElement.focus();
      } else if (tabBackwards) {
        e.preventDefault();
        lastElement.focus();
      }
    }
  };

  return trapFocus;
}
