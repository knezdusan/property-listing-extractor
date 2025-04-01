import { Page } from "playwright";
import { randomDelay } from "@/utils/helpers";

/**
 * Validates and extracts the Airbnb listing ID from a given URL string.
 *
 * Performs validation checks:
 * - Valid URL format
 * - HTTPS protocol
 * - Hostname matching airbnb domains (e.g., www.airbnb.com, www.airbnb.co.uk, etc.)
 * - Pathname starting with /rooms/, /homes/, or /stays/ followed by a numeric ID
 *   (optionally allowing /plus/ segment before the ID).
 *
 * @param urlString - The URL string to validate and extract from. Can be string, undefined, or null.
 * @returns The listing ID as a string if the URL is valid and the ID can be extracted, otherwise null.
 */
export function validateAirbnbUrl(urlString: string | undefined | null): string | null {
  // 1. Basic Input Check: Ensure it's a non-empty string
  if (typeof urlString !== "string" || urlString.trim() === "") {
    return null;
  }

  try {
    // 2. Parse the URL: This also validates the basic URL structure.
    const parsedUrl: URL = new URL(urlString);

    // 3. Check Protocol: Must be HTTPS
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    // 4. Check Hostname: Must be an Airbnb domain
    const hostnameRegex: RegExp = /^(www\.)?airbnb\.[a-z.]{2,}$/i;
    if (!hostnameRegex.test(parsedUrl.hostname)) {
      return null;
    }

    // 5. Check Pathname and Extract ID:
    //    Regex Explanation:
    //    ^                   - Start of the pathname string
    //    \/                  - Matches the initial forward slash
    //    (?:rooms|homes|stays) - Matches "rooms" OR "homes" OR "stays" (non-capturing group)
    //    \/                  - Matches the forward slash after the path segment
    //    (?:plus\/)?         - Optionally matches "plus/" literally (non-capturing group)
    //    (\d+)               - ***Capturing group*** for one or more digits (the listing ID)
    //    (?:\/.*)?           - Optionally matches a "/" followed by any characters (non-capturing group)
    //    $                   - End of the pathname string
    const pathnameExtractionRegex: RegExp = /^\/(?:rooms|homes|stays)\/(?:plus\/)?(\d+)(?:\/.*)?$/;

    const matchResult = parsedUrl.pathname.match(pathnameExtractionRegex);

    // 6. Return the captured ID or null
    if (matchResult && matchResult[1]) {
      // matchResult[0] is the full matched path, matchResult[1] is the first capturing group (\d+)
      return matchResult[1];
    } else {
      return null;
    }
  } catch (error: unknown) {
    console.error("❌ Error parsing URL:", error);
    return null;
  }
}

/**
 * Formats a listing ID into a complete Airbnb URL with mandatory query parameters
 * check in and check out dates are set to 15 and 16 days in next month
 * @param listingId The listing ID to format
 * @returns A formatted URL string with the listing ID and mandatory query parameters
 */
export function formatListingUrl(listingId: string): string {
  const today = new Date();
  let year = today.getFullYear();
  let month = String(today.getMonth() + 2).padStart(2, "0");
  if (month === "13") {
    year += 1;
    month = "01";
  }

  const startDate = `${year}-${month}-15`;
  const endDate = `${year}-${month}-16`;

  const basePath = `https://www.airbnb.com/rooms/${listingId}`;
  const queryString = `?check_in=${startDate}&check_out=${endDate}&guests=3&adults=1&children=1&infants=1&pets=1`;
  return `${basePath}${queryString}`;
}

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
