import { Page } from "playwright";
import { findNestedValue, isObject, randomDelay } from "@/utils/helpers";

/**
 * Smoothly scroll to a specified position on the page and wait for the scroll to complete
 * @param page Playwright Page object
 * @param position Position to scroll to (number or 'top', 'bottom')
 * @param waitAfter Additional time to wait after scrolling (in ms), defaults to 1000-2000ms
 */
export async function smoothScroll(
  page: Page,
  position: number | "top" | "bottom",
  waitAfter: boolean = true
): Promise<void> {
  // Convert position string to number if needed
  const scrollPosition =
    position === "top" ? 0 : position === "bottom" ? await page.evaluate(() => document.body.scrollHeight) : position;

  // Execute smooth scroll in browser context
  await page.evaluate(async (pos) => {
    window.scrollTo({
      top: pos,
      behavior: "smooth",
    });

    // Wait for the smooth scroll animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, scrollPosition);

  // Optional additional wait time after scrolling
  if (waitAfter) {
    await randomDelay(1000, 2000);
  }
}

/**
 * Closes visible, user-facing modals or popups on the page
 * @param page Playwright page object
 * @returns Promise that resolves when the visible modal is closed
 */
export async function closePopups(page: Page): Promise<void> {
  console.log("➜ Checking for visible popups/modals");

  // Wait for page to stabilize (post-render)
  await page.waitForLoadState("networkidle", { timeout: 10000 });

  // Detect visible modals: Look for centered, fixed-position elements with high z-index
  const modalCandidates = await page.$$eval('[style*="position: fixed"], [style*="position: absolute"]', (elements) =>
    elements.filter((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Must be visible
      if (style.display === "none" || style.visibility === "hidden") return false;

      // High z-index (modal-like)
      const zIndex = parseInt(style.zIndex, 10);
      if (zIndex < 1000) return false;

      // Centered on screen, not too large (exclude headers/footers)
      const isCentered =
        rect.left >= window.innerWidth * 0.1 &&
        rect.right <= window.innerWidth * 0.9 &&
        rect.top >= window.innerHeight * 0.1 &&
        rect.bottom <= window.innerHeight * 0.9;

      // Covers a reasonable area (modal-like, not a button or banner)
      const isModalSize =
        rect.width >= window.innerWidth * 0.3 &&
        rect.width <= window.innerWidth * 0.7 &&
        rect.height >= window.innerHeight * 0.2 &&
        rect.height <= window.innerHeight * 0.7;

      return isCentered && isModalSize;
    })
  );

  console.log(`Found ${modalCandidates.length} visible modal candidates`);

  if (modalCandidates.length === 0) {
    console.log("✓ No visible popups/modals detected");
    return;
  }

  // Process the first visible modal (Airbnb typically shows one at a time)
  for (let i = 0; i < modalCandidates.length; i++) {
    try {
      // Re-locate the modal in the DOM
      const modal = await page.$(
        '[style*="position: fixed"][style*="z-index"], [style*="position: absolute"][style*="z-index"]'
      );
      if (!modal || !(await modal.isVisible())) continue;

      // Look for a close button (top-left or top-right "X")
      const closeButton = await modal.evaluateHandle((el) => {
        const buttons = el.querySelectorAll("button, [role='button'], div");
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const text = btn.textContent?.toLowerCase() || "";
          const svg = btn.querySelector("svg");

          // Top-left or top-right position
          const isTopCorner =
            (rect.top < 100 && rect.left < 100) || // Top-left
            (rect.top < 100 && rect.right > window.innerWidth - 100); // Top-right

          // Contains "X" or SVG (common for close buttons)
          if (isTopCorner && (text.includes("x") || (svg && svg.getAttribute("viewBox")?.match(/32\s*32/)))) {
            return btn;
          }
        }
        return null;
      });

      if (closeButton && (await closeButton.asElement()?.isVisible())) {
        console.log("✓ Found a visible close button (X); clicking");
        await closeButton.asElement()?.click();
        await page.waitForTimeout(500); // Wait for animation
        await closeButton.dispose();
      } else {
        // Fallback: Look for a dismiss/accept button (e.g., "Accept all", "Only necessary")
        const dismissButton = await modal.$(
          'button:has-text("Accept"), button:has-text("Only necessary"), button:has-text("Dismiss")'
        );
        if (dismissButton && (await dismissButton.isVisible())) {
          console.log("✓ Found a dismiss button; clicking");
          await dismissButton.click();
          await page.waitForTimeout(500);
        } else {
          // Final fallback: Simulate Escape key
          console.log("➜ No close/dismiss button found; pressing Escape");
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
      }

      // Verify closure
      const stillOpen = await page.$('[style*="position: fixed"][style*="z-index"]');
      if (!stillOpen || !(await stillOpen.isVisible())) {
        console.log("✓ Modal closed successfully");
        break;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("⚠ Minor error during closure attempt:", errorMessage);
      continue;
    }
  }

  // Final check
  const remainingModals = await page.$$('[style*="position: fixed"][style*="z-index"]');
  const visibleRemaining: Array<unknown> = [];
  for (const modal of remainingModals) {
    if (await modal.isVisible()) visibleRemaining.push(modal);
  }

  if (visibleRemaining.length > 0) {
    console.warn("⚠ Some visible modals may still be open; manual inspection needed");
  } else {
    console.log("✓ Popup check complete");
  }
}

/**
 * Function to reduce API data to a more manageable format
 * @param apiData API data to be reduced
 * @returns Reduced API data
 */
export function reduceApiData(apiData: Record<string, unknown>): Record<string, unknown> | null {
  const reducedData: Record<string, unknown> = {};

  reducedData["section"] = findNestedValue(apiData, "section");

  if (!isObject(reducedData["section"])) {
    return null;
  }

  return reducedData;
}
