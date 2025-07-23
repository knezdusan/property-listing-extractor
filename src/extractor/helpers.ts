import { Page, Locator } from "playwright";
import { randomDelay } from "@/utils/helpers";
import { airbnbUrlIdPatternNumeric, airbnbUrlIdPatternSlug } from "@/utils/zod";
import { BrandingIdentity, ListingBrand, ListingMain, Review, TemplateData, TopReviews } from "./types";
import fs from "fs";
import path from "path";
import { generateAIObject, generateAiText } from "@/utils/ai";
import { z } from "zod";

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
export function formatListingUrl(listingId: string): string | null {
  const today = new Date();
  let year = today.getFullYear();
  let month = String(today.getMonth() + 2).padStart(2, "0");
  if (month === "13") {
    year += 1;
    month = "01";
  }

  const startDate = `${year}-${month}-15`;
  const endDate = `${year}-${month}-16`;
  const queryString = `?check_in=${startDate}&check_out=${endDate}&guests=3&adults=1&children=1&infants=1&pets=1`;

  // Check if listing is from the /rooms/ (numeric id) or from the /h/ (slug id) type
  if (airbnbUrlIdPatternNumeric.test(listingId)) {
    return `https://www.airbnb.com/rooms/${listingId}${queryString}`;
  } else if (airbnbUrlIdPatternSlug.test(listingId)) {
    return `https://www.airbnb.com/h/${listingId}${queryString}`;
  } else {
    return null;
  }
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
 * Finds the number of reviews on an Airbnb listing page using multiple pattern matching strategies
 * @param page The Playwright Page object
 * @returns The number of reviews as a number, or null if not found
 */
export async function findReviewsNumber(page: Page): Promise<number | null> {
  console.log("➜ Finding reviews number on page...");

  try {
    return await page.evaluate(() => {
      // Case where no reviews for the property
      const textContent = Array.from(document.querySelectorAll("*"))
        .map((el) => {
          // Get the direct text content of this element (not including children)
          const text = Array.from(el.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join(" ");

          // Only return non-empty text with a space suffix to preserve separation
          return text.trim() ? text.trim() + " " : "";
        })
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      // Check for "No reviews (yet)" pattern first
      if (textContent.includes("No reviews (yet)") || textContent.includes("No reviews yet")) {
        console.warn("⚠ No reviews found as 'No reviews (yet) pattern was matched");
        return 0; // Return 0 when there are no reviews
      }

      // Try multiple patterns that might contain review counts
      const patterns = [/(\d+)\s+reviews/i, /(\d+)\s+review/i];

      // Try each pattern
      for (const pattern of patterns) {
        const match = textContent.match(pattern);
        if (match && match[1]) {
          return parseInt(match[1], 10); // Convert string to number
        }
      }

      // Fallback to more generic pattern if specific patterns fail
      const genericMatch = textContent.match(/(\d+)\s*reviews?/i);
      if (genericMatch && genericMatch[1]) {
        return parseInt(genericMatch[1], 10); // Convert string to number
      }

      return null; // No matches found
    });
  } catch (error) {
    console.error(`❌ Error finding reviews number: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

/**
 * Finds the "Show all reviews" button using multiple Playwright locator strategies.
 * Checks visibility before returning the locator.
 * @param page The Playwright Page object.
 * @returns A Playwright Locator for the button, or null if not found or not visible.
 */
export async function locateAndScrollToReviewsButton(page: Page): Promise<Locator | null> {
  console.log("➜ Finding and scrolling to Show all reviews button...");
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

/**
 * Loads all reviews from the Airbnb property listing modal by scrolling the modal dynamically.
 * Assumes the modal is already open and visible on the page.
 *
 * @param page - The Playwright Page instance.
 * @returns A Promise that resolves when all reviews are loaded.
 * @throws Error if the modal or scrollable element cannot be found, or if loading fails.
 */
export async function loadAllReviews(page: Page, modalSelector: string, reviewSelector: string): Promise<null | void> {
  // Step 1: Locate the modal using semantic attributes
  const modal = await page.locator(modalSelector);
  await modal.waitFor({ state: "visible", timeout: 10000 });
  if (!(await modal.isVisible())) {
    console.error("❌ Error: Reviews modal not found or not visible.");
    return null;
  }
  console.log("✓ Modal found and visible.");

  // Step 2: Locate the scrollable element with a generic selector and a fallback
  let scrollableElement: Locator | null = null;

  // Primary Approach: Use a more generic selector that doesn't enforce nesting depth
  const candidates = await modal.locator(`div:has(${reviewSelector})`).all();
  for (const candidate of candidates) {
    const isScrollable = await candidate.evaluate((el) => el.scrollHeight > el.clientHeight);
    if (isScrollable) {
      scrollableElement = candidate;
      console.log("✓ Scrollable element found using generic selector (div containing reviews at any depth).");
      break;
    }
  }

  if (!scrollableElement || !(await scrollableElement.isVisible())) {
    console.warn(
      "⚠ Generic selector (div containing reviews) failed or not scrollable. Falling back to known working selector..."
    );

    // Fallback: Use the known working selector with specific nesting
    scrollableElement = await modal.locator(`div:has(> div ${reviewSelector})`).first();
    if (!(await scrollableElement.isVisible())) {
      const modalHtml = await modal.innerHTML();
      console.warn("⚠ Modal HTML for debugging:", modalHtml);
      console.error("❌ Error: Scrollable element not found in the modal using any approach.");
      return null;
    }
    console.log("✓ Scrollable element found using fallback selector (direct child with specific nesting).");
  }

  // Step 3: Scroll the modal to load all reviews dynamically
  let previousReviewCount = 0;
  let currentReviewCount = 0;
  const maxReviews = 200;
  const maxAttempts = 20; // Prevent infinite loops
  let attempts = 0;

  while (attempts < maxAttempts) {
    const reviews = await scrollableElement.locator(reviewSelector);
    currentReviewCount = await reviews.count();

    console.log(`⏱ Loaded ${currentReviewCount} reviews so far...`);

    if (currentReviewCount > maxReviews || (currentReviewCount === previousReviewCount && attempts > 0)) {
      console.log(`✓ No more reviews to load. Total reviews loaded: ${currentReviewCount}.`);
      break;
    }

    await scrollableElement.evaluate((el) => {
      el.scrollTo(0, el.scrollHeight);
    });

    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch((error) => {
      console.warn(`⚠ Network idle wait failed: ${error.message}`);
    });

    previousReviewCount = currentReviewCount;
    attempts++;
  }

  // Step 4: Verify that reviews were loaded
  if (currentReviewCount === 0) {
    console.error("❌ No reviews found for this listing.");
    return null;
  }
}

/**
 * Finds the value of the first property matching the given name in a deeply nested structure
 * using an iterative Breadth-First Search (BFS) approach. Handles circular references.
 *
 * @param obj The complex object to search within.
 * @param propName The name of the property to find.
 * @returns The value of the found property (can be primitive, object, or array),
 *          or `null` if the property is not found. The return type is `unknown`
 *          as the value's type isn't known at compile time.
 */
export function getNestedValue(obj: Record<string, unknown>, propName: string): unknown {
  // Base case: If obj is not a searchable object/array, return null.
  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  // Queue holds items (objects/arrays) to explore. 'unknown' is used as elements can be anything.
  const queue: unknown[] = [obj];
  // Visited tracks object references to prevent infinite loops in circular structures.
  // We only add non-null objects to this set.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item. It's 'unknown' until we inspect it.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited in this path.
    // Need the type check again because the queue holds 'unknown'.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // At this point, TypeScript knows `current` is a non-null `object`.
    // We add it to visited.
    visited.add(current);

    // 1. Check if the property exists directly on the current object/array.
    //    Use Object.prototype.hasOwnProperty.call for safety.
    if (Object.prototype.hasOwnProperty.call(current, propName)) {
      // Property found! Return its value.
      // We need to assert the type of `current` to allow indexing.
      // Using a Record with string keys is more specific than 'keyof any'
      return (current as Record<string, unknown>)[propName];
    }

    // 2. Add nested objects/arrays to the queue for later exploration.
    //    Iterate over keys for objects or indices (as strings) for arrays.
    //    `key` is `string` in a for...in loop.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // Access the value. Need type assertion again to index `current`.
        const value = (current as Record<string, unknown>)[key];

        // Only queue actual objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          // --- Type Assertion Point ---
          // Here, TypeScript knows `value` is a non-null `object`.
          // Optimization: Check visited *before* pushing to potentially avoid growing the queue unnecessarily.
          if (!visited.has(value)) {
            queue.push(value); // Add nested structures to the end of the queue
          }
        }
      }
    }
  }

  // 3. If the queue is empty and the property wasn't found anywhere.
  return null;
}

/**
 * Finds and removes the first occurrence of a property with the given name
 * in a deeply nested structure using an iterative Breadth-First Search (BFS) approach.
 * Modifies the original object/array in place. Handles circular references.
 * @param obj The complex object or array to search within and modify. Can be any structure.
 * @param propName The name of the property to find and remove.
 * @returns `true` if the property was found and removed, `false` otherwise.
 */
export function removeNestedValue(obj: unknown, propName: string): boolean {
  // Base case: If obj is not a searchable/modifiable object/array, do nothing.
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Queue holds items (objects/arrays) to explore.
  const queue: unknown[] = [obj];
  // Visited tracks object references to prevent infinite loops in circular structures.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // `current` is a non-null `object`.
    visited.add(current);

    // Iterate through the keys/indices of the current object/array.
    // `key` will be a string, even for array indices.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // --- Check if the CURRENT key is the one to remove ---
        if (key === propName) {
          // Found the property on the 'current' object/array. Now remove it.
          if (Array.isArray(current)) {
            // Use splice for arrays. Need to convert string key to number.
            const index = parseInt(key, 10);
            // Ensure it's a valid number index before splicing
            if (!isNaN(index) && index >= 0 && index < current.length) {
              current.splice(index, 1);
              return true; // Property found and removed
            } else {
              // This case is unlikely if hasOwnProperty passed for a standard array,
              // but handle defensively. Maybe it's a non-index property on an array?
              // Treat as object deletion.
              delete (current as unknown as Record<string, unknown>)[key]; // Less ideal for arrays, but covers edge cases
              return true;
            }
          } else {
            // Use delete for objects.
            // Type assertion needed to satisfy TypeScript's index signature rules.
            delete (current as Record<string, unknown>)[key];
            return true; // Property found and removed
          }
        }

        // --- If not the target key, check the VALUE for queueing ---
        // Access the value associated with the key. Assertion needed.
        const value = (current as Record<string, unknown>)[key];

        // Only queue nested objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          // --- Type Assertion Point ---
          // `value` is a non-null `object`.
          // Add to queue only if not already visited.
          if (!visited.has(value)) {
            queue.push(value);
          }
        }
      }
    }
  }

  // 3. If the queue is empty and the property wasn't found anywhere.
  return false;
}

/**
 * Finds the first nested object (of object array) with specific key (`targetKeyName`), eg "section"
 * where that object has a specific property (`checkPropName`) matching a given value (`checkPropValue`), eg "__typename": "someValue".
 * Uses an iterative Breadth-First Search (BFS) and handles circular references.
 *
 * @param objToSearch The complex object or array (like apiData) to search within.
 * @param targetKeyName The name of the key whose value is the potential target object (e.g., "section").
 * @param checkPropName The name of the property within the target object to check (e.g., "__typename").
 * @param checkPropValue The value that the `checkPropName` property must match.
 * @returns The first matching target object found, or `null` if no match is found.
 *          The return type is `Record<string, unknown> | null`.
 */
export function findNestedObjectByPropValue(
  objToSearch: unknown,
  targetKeyName: string,
  checkPropName: string,
  checkPropValue: string
): Record<string, unknown> | null {
  // Base case: If obj is not a searchable object/array, return null.
  if (typeof objToSearch !== "object" || objToSearch === null) {
    return null;
  }

  // Queue holds items (objects/arrays) to explore.
  const queue: unknown[] = [objToSearch];
  // Visited tracks object references to prevent infinite loops in circular structures.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // `current` is a non-null `object`.
    visited.add(current);

    // Iterate through the keys/indices of the current object/array.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // --- Core Logic: Check if this key matches targetKeyName ---
        if (key === targetKeyName) {
          const potentialTarget = (current as Record<string, unknown>)[key];

          // --- Check if the value is an object and has the target property/value ---
          if (
            typeof potentialTarget === "object" && // Is it an object?
            potentialTarget !== null && // Is it not null?
            Object.prototype.hasOwnProperty.call(potentialTarget, checkPropName) && // Does it have the check property?
            (potentialTarget as Record<string, unknown>)[checkPropName] === checkPropValue // Does the value match?
          ) {
            // Found it! Return the target object itself.
            return potentialTarget as Record<string, unknown>;
          }
        }

        // --- Queueing Logic: If the current *value* is an object/array, queue it ---
        // Access the value associated with the key. Assertion needed.
        const value = (current as Record<string, unknown>)[key];

        // Only queue nested non-null objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          if (!visited.has(value)) {
            // Check visited before push (minor optimization)
            queue.push(value);
          }
        }
      }
    }
  }

  // If the queue is empty and the target object wasn't found.
  return null;
}

/**
 * Finds all nested object (of object array) with specific key (`targetKeyName`), eg "section"
 * and return the first one that is not null or undefined.
 *
 * @param objToSearch The complex object or array (like apiData) to search within.
 * @param targetKeyName The name of the key whose value is the potential target object (e.g., "section").
 * @returns The first matching target object found that is not null or undefined, or `null` if no match is found.
 *          The return type is `Record<string, unknown> | null` or `Record<string, unknown>[]` | `null`.
 */

export function findFirstNestedObjectNotNullOrUndefined(
  objToSearch: unknown,
  targetKeyName: string
): Record<string, unknown> | Record<string, unknown>[] | null {
  // Base case: If obj is not a searchable object/array, return null.
  if (typeof objToSearch !== "object" || objToSearch === null) {
    return null;
  }

  // Queue holds items (objects/arrays) to explore.
  const queue: unknown[] = [objToSearch];
  // Visited tracks object references to prevent infinite loops in circular structures.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }

    // Mark as visited to prevent circular reference issues
    visited.add(current);

    // Iterate through the keys/indices of the current object/array.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // Check if this key matches targetKeyName
        if (key === targetKeyName) {
          const potentialTarget = (current as Record<string, unknown>)[key];

          // Check if the value is not null or undefined
          if (potentialTarget !== null && potentialTarget !== undefined) {
            // Found a non-null, non-undefined value for the target key
            return potentialTarget as Record<string, unknown> | Record<string, unknown>[];
          }
        }

        // Queue nested objects/arrays for further exploration
        const value = (current as Record<string, unknown>)[key];

        // Only queue nested non-null objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          if (!visited.has(value)) {
            // Check visited before push (optimization)
            queue.push(value);
          }
        }
      }
    }
  }

  // If the queue is empty and no non-null/undefined target was found.
  return null;
}

/**
 * Analyzes a list of reviews to extract top guest feedback.
 *
 * @param reviewsData - An array of Review objects containing guest reviews.
 * @returns An array of TopReviews objects containing the top guest feedback, or null if no reviews are provided.
 */
export function getTopGuestReviews(reviewsData: Review[], topReviewsCount = 5): TopReviews[] | null {
  if (!reviewsData || reviewsData.length === 0) {
    return null;
  }

  // Expanded keyword list
  const reviewKeywords = [
    // Location & Vibe
    "location",
    "walk",
    "quiet",
    "private",
    "neighborhood",
    "central",
    "close",
    "view",
    "peaceful",
    "vibe",
    // Cleanliness & Comfort
    "clean",
    "comfortable",
    "cozy",
    "spotless",
    "immaculate",
    "beds",
    // Host
    "host",
    "responsive",
    "helpful",
    "communication",
    "friendly",
    "welcoming",
    // Property & Amenities
    "garden",
    "patio",
    "kitchen",
    "beautiful",
    "modern",
    "charming",
    // Guest Type
    "family",
    "pet",
    "kids",
    "couple",
    "work",
    "group",
  ];

  // Handle cases with just a few reviews
  const keywordCounts: Record<string, number> = reviewKeywords.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);
  const topReviews: import("./types").TopReviews[] = [];

  for (const review of reviewsData) {
    if (!review.comments) continue;
    const comment = review.comments;

    for (const key of reviewKeywords) {
      if (comment.includes(key)) {
        keywordCounts[key]++;
      }
    }

    // Loosen criteria slightly for smaller review counts
    const topReviewsTreshold = reviewsData.length < 10 ? 100 : 150;
    if (
      review.rating >= 4 &&
      comment.length > topReviewsTreshold &&
      topReviews.length < topReviewsCount &&
      review.reviewer
    ) {
      topReviews.push({
        text: review.comments.trim(),
        name: review.reviewer.name || "Anonymous",
        photo: review.reviewer.photo || "",
      });
    }
  }

  return topReviews;
}

/**
 * Takes an array of TopReviews objects and returns a string containing the top reviews in the format "Reviewer: [name], Review: [review]".
 * @param topReviews The array of TopReviews objects to process.
 * @returns A string containing the top reviews in the format "Reviewer: [name], Review: [review];".
 */
export function getTopReviewsText(topReviews: TopReviews[]): string {
  if (!topReviews || topReviews.length === 0) {
    return "";
  }
  return topReviews.map((r) => `“Reviewer: ${r.name}, Review: ${r.text}”`).join("; ");
}

/**
 * Reads an AI prompt template markdown file and returns its content as a string.
 * @param pathToPromptTemplateMd The path to the markdown file, eg. "src/extractor/prompts/listing_description.md".
 * @returns The content of the markdown file as a string.
 */
export function getPromptTemplate(pathToPromptMd: string): string {
  const promptPath = path.join(process.cwd(), pathToPromptMd);
  return fs.readFileSync(promptPath, "utf8");
}

/**
 * Fills a template string with values from a data object.
 * Placeholders must be in the form {key}.
 * Example: fillPromptTemplate('Hello {name}', { name: 'Alice' }) => 'Hello Alice'
 */
export function fillPromptTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{([\w.]+)\}/g, (_match: string, key: string) => {
    const value = key.split(".").reduce<unknown>((obj: unknown, prop: string) => {
      if (obj && typeof obj === "object" && prop in obj) {
        return (obj as Record<string, unknown>)[prop];
      }
      return undefined;
    }, data);
    return value !== undefined && value !== null ? String(value) : "";
  });
}

/**
 * Enriches a listing description using AI if it's under 150 words
 * @param listing The listing data containing description and other details
 * @param topReviewsText Text containing top reviews for the listing
 * @returns Promise resolving to the enriched description or null if generation fails
 */
export async function getEnrichedDescription(listingMain: ListingMain, topReviewsText: string): Promise<string | null> {
  const promptTemplate = getPromptTemplate("src/extractor/prompts/description-enrichement.md");

  // Create template data with the correct type assertion
  const templateData = {
    listingMain,
    top_reviews: topReviewsText,
  } as unknown as TemplateData;

  const filledPromptTemplate = fillPromptTemplate(promptTemplate, templateData);

  return generateAiText(filledPromptTemplate, 2048);
}

/**
 * Generates a branding identity for a property listing using AI
 * @param listingBrand The listing data needed for brand identity generation
 * @returns Promise resolving to the branding identity object or null if generation fails
 */
export async function getBrandingIdentity(listingBrand: ListingBrand): Promise<BrandingIdentity | null> {
  // Define the schema for the branding identity object
  const brandingSchema = z.object({
    brandName: z.string().describe("An evocative and memorable name for the property"),
    tagline: z.string().describe("A short, catchy, and benefit-driven tagline"),
    brandVibe: z.string().describe("3-5 descriptive words that define the personality of the property"),
    keywords: z.array(z.string()).describe("4-5 primary keywords crucial for SEO and marketing"),
  });

  const promptTemplate = getPromptTemplate("src/extractor/prompts/brand-identity.md");

  // Create template data with the correct type assertion
  const templateData = {
    listing: listingBrand,
  } as unknown as TemplateData;

  const filledPromptTemplate = fillPromptTemplate(promptTemplate, templateData);

  // Pass both the prompt and schema to generateAIObject
  return generateAIObject(
    filledPromptTemplate,
    brandingSchema,
    "BrandingIdentity",
    "Property listing branding identity",
    1024
  );
}
