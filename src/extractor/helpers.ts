import { Page, Locator } from "playwright";
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
 * Helper function to perform smooth scroll to a given locator.
 * Includes fallback to immediate scroll if smooth scroll fails.
 * @param page The Playwright Page object.
 * @param locator The Playwright Locator to scroll to.
 */
async function smoothScrollToLocator(page: Page, locator: Locator): Promise<void> {
  try {
    const elementHandle = await locator.elementHandle();
    if (elementHandle) {
      await page.evaluate(async (element) => {
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(750 + Math.random() * 500); // Wait for scroll animation
      }, elementHandle);
      await elementHandle.dispose();
      await randomDelay(500, 1000); // Pause after scroll
    } else {
      console.warn("⚠ Could not get element handle, falling back to default scroll.");
      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await randomDelay(500, 1000); // Pause after scroll
    }
  } catch (scrollError) {
    console.error(
      `❌ Error during scrolling: ${scrollError instanceof Error ? scrollError.message : scrollError}. Falling back.`
    );
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await randomDelay(500, 1000); // Pause after scroll
    } catch (fallbackScrollError) {
      console.error(
        `❌ Fallback scroll also failed: ${
          fallbackScrollError instanceof Error ? fallbackScrollError.message : fallbackScrollError
        }`
      );
    }
  }
}

/**
 * Closes potential popups or modals that might appear on the page
 * @param page Playwright Page object
 * @param maxAttempts Maximum number of attempts to close popups
 */
export async function closePopups(page: Page, maxAttempts: number = 3): Promise<void> {
  console.log("➜ Checking for potential popups/modals...");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let closedPopup = false;

    try {
      // Strategy 1: Role-based dialogs
      const closeButtonSelectors = [
        'button[aria-label*="close" i], button[aria-label*="dismiss" i]',
        'button:has-text("Close"), button:has-text("Dismiss")',
        'button[class*="close" i]',
      ];

      const dialogs = page.locator('[role="dialog"], [role="alertdialog"]');
      const dialogCount = await dialogs.count();

      if (dialogCount > 0) {
        console.log(`➜ Attempt ${attempt}: Found ${dialogCount} dialog(s)`);

        for (let i = 0; i < dialogCount; i++) {
          const dialog = dialogs.nth(i);
          if (!(await dialog.isVisible({ timeout: 2000 }).catch(() => false))) continue;

          for (const selector of closeButtonSelectors) {
            const closeButton = dialog.locator(selector).first();
            if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
              await closeButton.click({ force: true, timeout: 5000 });
              console.log(`✓ Closed popup via button selector: ${selector}`);
              closedPopup = true;
              await page.waitForTimeout(1000);
              break;
            }
          }

          if (closedPopup) break;
        }
      }

      // Strategy 2: Overlay handling
      const overlayHandle = await page.evaluateHandle(() => {
        const elements = document.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]');
        return (
          Array.from(elements).find((el) => {
            // Add type guard first
            if (!(el instanceof HTMLElement)) return false;

            const style = window.getComputedStyle(el);
            return (
              parseInt(style.zIndex || "0", 10) > 999 &&
              el.offsetWidth >= window.innerWidth * 0.7 &&
              el.offsetHeight >= window.innerHeight * 0.7
            );
          }) || null
        );
      });

      if (overlayHandle) {
        const overlayElement = overlayHandle.asElement();
        if (overlayElement && (await overlayElement.isVisible())) {
          await overlayElement.click({ force: true, timeout: 3000 });
          console.log("✓ Closed popup via overlay click");
          closedPopup = true;
        }
        await overlayHandle.dispose();
      }

      // Final fallback
      if (!closedPopup && attempt === maxAttempts) {
        console.log("✓ Final fallback: Pressing Escape");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.warn(`⚠ Attempt ${attempt} error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (closedPopup) {
        await page.waitForLoadState("networkidle", { timeout: 3000 });
      }
    }

    if (closedPopup) {
      console.log(`✓ Attempt ${attempt}: Successfully closed popup`);
      break;
    }
  }

  console.log("✓ Popup check complete");
}

/**
 * Finds the "Show all reviews" button using multiple Playwright locator strategies.
 * Checks visibility before returning the locator.
 * @param page The Playwright Page object.
 * @returns A Playwright Locator for the button, or null if not found or not visible.
 */
export async function locateAndScrollToReviewsButton(page: Page): Promise<Locator | null> {
  console.log("➜ Finding and scrolling to reviews button...");
  const textRegex = /Show all \d+ reviews/i;
  let attempts = 0;
  const maxAttempts = 3; // Add retries in case of timing issues

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`➜ Attempt ${attempts}/${maxAttempts}...`);

    try {
      // 1. Try finding button/link by text content (checking visibility)
      const buttonByText = page.getByRole("button", { name: textRegex });
      const linkByText = page.getByRole("link", { name: textRegex });
      const buttonOrLinkByText = buttonByText.or(linkByText).first(); // Use first() in case multiple matches

      if (await buttonOrLinkByText.isVisible({ timeout: 2000 })) {
        console.log("✔ Found reviews button via text content ('Show all #number reviews')");
        await smoothScrollToLocator(page, buttonOrLinkByText);
        return buttonOrLinkByText;
      }

      // 2. Fallback to data-testid (checking visibility)
      const buttonByTestId = page.getByTestId("pdp-show-all-reviews-button");
      if (await buttonByTestId.isVisible({ timeout: 2000 })) {
        console.log("✔ Found reviews button via data-testid attribute selector");
        await smoothScrollToLocator(page, buttonByTestId);
        return buttonByTestId;
      }

      // 3. Fallback to aria-label (checking visibility)
      const elementByLabel = page.locator(`[aria-label*="Show all"][aria-label*="reviews"]`).first(); // Less strict label match
      if (await elementByLabel.isVisible({ timeout: 2000 })) {
        console.log("✔ Found reviews button via aria-label attribute selector");
        await smoothScrollToLocator(page, elementByLabel);
        return elementByLabel;
      }
    } catch (e) {
      // Ignore timeout errors during isVisible check, proceed to next attempt or fallback
      if (e instanceof Error && e.message.includes("Timeout")) {
        console.log(`➜ Visibility check timed out on attempt ${attempts}, trying next...`);
      } else {
        console.error(`❌ Error during find attempt ${attempts}:`, e);
      }
    }

    if (attempts < maxAttempts) {
      await page.waitForTimeout(1000); // Wait before retrying
    }
  }

  console.log("❌ Reviews button could not be located after multiple attempts.");
  return null;
}
