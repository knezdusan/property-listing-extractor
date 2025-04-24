import { Page, Locator } from "playwright";
import { randomDelay } from "@/utils/helpers";
import { supabaseServer } from "@/utils/supabase";
import type { ListingData } from "./types";

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
 * Finds the number of reviews on an Airbnb listing page using multiple pattern matching strategies
 * @param page The Playwright Page object
 * @returns The number of reviews as a number, or null if not found
 */
export async function findReviewsNumber(page: Page): Promise<number | null> {
  console.log("➜ Finding reviews number on page...");

  try {
    return await page.evaluate(() => {
      // Try multiple patterns that might contain review counts
      const patterns = [/(\d+)\s+reviews/i, /(\d+)\s+review/i];

      // Get normalized text content with preserved spacing
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
 * Persists a complete ListingData object into Supabase tables according to schema.sql.
 * Deletes existing related rows for this listing to prevent duplicates, then inserts fresh data.
 */
export async function saveListingData(listingData: ListingData): Promise<boolean> {
  const {
    host,
    listing,
    location,
    house_rules,
    safety_property,
    amenities,
    gallery,
    availability,
    category_ratings,
    reviews,
  } = listingData;
  // Track which tables were written to for compensation
  const completed: { [key: string]: boolean } = {};
  try {
    // *** Upsert host
    const { error: hostError } = await supabaseServer.from("hosts").upsert(
      {
        id: host.id,
        name: host.name,
        superhost: host.superhost,
        photo: host.photo,
        review_count: host.reviews,
        rating: host.rating,
        years_hosting: host.years_hosting ?? null,
        about: host.about,
        highlights: host.highlights ?? [],
        details: host.details ?? [],
        cohosts: host.co_hosts ?? [],
      },
      { onConflict: "id" }
    );
    if (hostError) throw new Error(`Error upserting host: ${hostError.message}`);
    completed.host = true;

    // 2. Upsert listing
    const [lat, lng] = location.coordinates.split(",").map((c) => parseFloat(c.trim()));
    const { error: listingError } = await supabaseServer.from("listings").upsert(
      {
        id: listing.id,
        host_id: host.id,
        url: listing.url,
        type: listing.type,
        privacy: listing.privacy,
        title: listing.title,
        subtitle: listing.subtitle,
        description: listing.description,
        highlights: listing.highlights ?? [],
        hero: listing.hero,
        average_daily_rate: listing.average_daily_rate,
        min_nights: availability.minNights,
        capacity_summary: listing.capacity,
        house_rules_summary: house_rules.house_rules_summary,
        safety_features_summary: safety_property.safety_features_summary,
        tags: listing.tags,
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: lat,
        longitude: lng,
        location_disclaimer: location.disclaimer ?? null,
        rating_overall: category_ratings.guest_satisfaction,
        rating_accuracy: category_ratings.accuracy,
        rating_check_in: category_ratings.check_in,
        rating_cleanliness: category_ratings.cleanliness,
        rating_communication: category_ratings.communication,
        rating_location: category_ratings.location,
        rating_value: category_ratings.value,
      },
      { onConflict: "id" }
    );
    if (listingError) throw new Error(`Error upserting listing: ${listingError.message}`);
    completed.listing = true;

    // *** Sleeping arrangements
    await supabaseServer.from("sleeping").delete().eq("listing_id", listing.id);
    if (listing.sleeping_arrangement?.length) {
      const sleepRows = listing.sleeping_arrangement.map((sa) => ({
        listing_id: listing.id,
        title: sa.title,
        subtitle: sa.subtitle,
        photos: sa.images ?? [],
      }));
      const { error } = await supabaseServer.from("sleeping").insert(sleepRows);
      if (error) throw new Error(`Error inserting sleeping arrangements: ${error.message}`);
      completed.sleeping = true;
    }

    // *** Location details
    await supabaseServer.from("location_details").delete().eq("listing_id", listing.id);
    if (location.details?.length) {
      const locRows = location.details.map((d) => ({
        listing_id: listing.id,
        title: d.title,
        content: d.content,
      }));
      const { error } = await supabaseServer.from("location_details").insert(locRows);
      if (error) throw new Error(`Error inserting location details: ${error.message}`);
      completed.location_details = true;
    }

    // *** Amenities
    await supabaseServer.from("amenities").delete().eq("listing_id", listing.id);
    if (amenities.length) {
      const amRows = amenities.flatMap((cat) =>
        cat.amenities.map((a) => ({
          listing_id: listing.id,
          category: cat.category,
          title: a.title,
          subtitle: a.subtitle,
          top: a.top,
          icon: a.icon,
          available: a.available,
        }))
      );
      const { error } = await supabaseServer.from("amenities").insert(amRows);
      if (error) throw new Error(`Error inserting amenities: ${error.message}`);
      completed.amenities = true;
    }

    // *** Photos
    await supabaseServer.from("photos").delete().eq("listing_id", listing.id);
    if (gallery.photos?.length) {
      const photoRows = gallery.photos.map((p) => ({
        id: p.id,
        listing_id: listing.id,
        url: p.baseUrl,
        aspect_ratio: p.aspectRatio ?? null,
        orientation: p.orientation ?? null,
        accessibility_label: p.accessibilityLabel ?? null,
        caption: p.caption ?? null,
      }));
      const { error } = await supabaseServer.from("photos").insert(photoRows);
      if (error) throw new Error(`Error inserting photos: ${error.message}`);
      completed.photos = true;
    }

    // *** Tour
    await supabaseServer.from("tour").delete().eq("listing_id", listing.id);
    if (gallery.tour?.length) {
      const tourRows = gallery.tour.map((t) => ({
        listing_id: listing.id,
        title: t.title,
        photos: t.photos,
        highlights: t.highlights,
      }));
      const { error } = await supabaseServer.from("tour").insert(tourRows);
      if (error) throw new Error(`Error inserting tour: ${error.message}`);
      completed.tour = true;
    }

    // *** Availability
    await supabaseServer.from("availability").delete().eq("listing_id", listing.id);
    if (availability.booked?.length) {
      const avRows = availability.booked.map((b) => ({
        listing_id: listing.id,
        start_date: b.start,
        end_date: b.end,
        checkin: b.checkin,
        checkout: b.checkout,
      }));
      const { error } = await supabaseServer.from("availability").insert(avRows);
      if (error) throw new Error(`Error inserting availability: ${error.message}`);
      completed.availability = true;
    }

    // *** House rules
    await supabaseServer.from("house_rules").delete().eq("listing_id", listing.id);
    if (house_rules.sections?.length) {
      const hrRows = house_rules.sections.flatMap((sec) =>
        sec.rules.map((r) => ({
          listing_id: listing.id,
          section: sec.section,
          title: r.title,
          subtitle: r.subtitle,
          html: r.html,
        }))
      );
      const { error } = await supabaseServer.from("house_rules").insert(hrRows);
      if (error) throw new Error(`Error inserting house rules: ${error.message}`);
      completed.house_rules = true;
    }

    // *** Safety & property features
    await supabaseServer.from("safety_property").delete().eq("listing_id", listing.id);
    if (safety_property.sections?.length) {
      const spRows = safety_property.sections.flatMap((sec) =>
        sec.rules.map((r) => ({
          listing_id: listing.id,
          section: sec.section,
          title: r.title,
          subtitle: r.subtitle,
          html: r.html,
        }))
      );
      const { error } = await supabaseServer.from("safety_property").insert(spRows);
      if (error) throw new Error(`Error inserting safety_property: ${error.message}`);
      completed.safety_property = true;
    }

    // *** Reviews
    await supabaseServer.from("reviews").delete().eq("listing_id", listing.id);
    if (reviews?.length) {
      const rvRows = reviews.map((r) => ({
        id: r.id,
        listing_id: listing.id,
        reviewer_id: r.reviewer.id,
        name: r.reviewer.name,
        photo: r.reviewer.photo,
        language: r.language,
        comments: r.comments,
        rating: r.rating,
        highlight: r.highlight ?? null,
        period: r.period ?? null,
        response: r.response ?? null,
        created_at: r.createdAt,
      }));
      const { error } = await supabaseServer.from("reviews").insert(rvRows);
      if (error) throw new Error(`Error inserting reviews: ${error.message}`);
      completed.reviews = true;
    }

    return true;
  } catch (error) {
    // Compensation: attempt to delete all previously inserted/updated data for this listing
    try {
      const id = listingData.listing.id;
      if (completed.reviews) await supabaseServer.from("reviews").delete().eq("listing_id", id);
      if (completed.safety_property) await supabaseServer.from("safety_property").delete().eq("listing_id", id);
      if (completed.house_rules) await supabaseServer.from("house_rules").delete().eq("listing_id", id);
      if (completed.availability) await supabaseServer.from("availability").delete().eq("listing_id", id);
      if (completed.tour) await supabaseServer.from("tour").delete().eq("listing_id", id);
      if (completed.photos) await supabaseServer.from("photos").delete().eq("listing_id", id);
      if (completed.amenities) await supabaseServer.from("amenities").delete().eq("listing_id", id);
      if (completed.location_details) await supabaseServer.from("location_details").delete().eq("listing_id", id);
      if (completed.sleeping) await supabaseServer.from("sleeping").delete().eq("listing_id", id);
      if (completed.listing) await supabaseServer.from("listings").delete().eq("id", id);
      if (completed.host) await supabaseServer.from("hosts").delete().eq("id", listingData.host.id);
      console.log("✔ Successfully rolled back previous insertions");
    } catch (compError) {
      console.error("❌ Compensation (rollback) failed:", compError);
    }
    console.error("❌ saveListingData failed:", error);
    return false;
  }
}
