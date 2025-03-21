import { load } from "cheerio";
import { Page } from "playwright";
import { randomDelay } from "@/utils/helpers";

// Clear HTML content of non-essential tags and attributes
export function clearHtml(html: string) {
  const $ = load(html);

  // Remove non-essential tags
  $("script, style, noscript, iframe, svg").remove();

  // Important attribute prefixes and names to preserve
  const preserveAttributePrefixes = ["data-", "aria-"];
  const importantAttributes = [
    "id",
    "src",
    "alt",
    "href",
    "content",
    "class",
    "title",
    "datetime",
    "itemprop",
    "property",
    "name",
    "rel",
    "type",
    "value",
    "placeholder",
    "role",
    "lang",
    "dir",
  ];
  const preserveElementsWithAllAttribs = [
    "meta",
    "link",
    "img",
    "a",
    "time",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ];

  // Strip attributes selectively
  $("*").each((i, el) => {
    if ("attribs" in el) {
      // Preserve all attributes for specific elements
      if (preserveElementsWithAllAttribs.includes(el.tagName)) {
        return;
      }

      // For other elements, selectively keep important attributes
      const attributeKeys = Object.keys(el.attribs);
      for (const key of attributeKeys) {
        // Check if this attribute should be preserved
        const isPrefixMatch = preserveAttributePrefixes.some((prefix) => key.startsWith(prefix));
        const isImportantAttribute = importantAttributes.includes(key);

        if (!isPrefixMatch && !isImportantAttribute) {
          delete el.attribs[key];
        }
      }
    }
  });

  // Remove empty tags to reduce noise
  $("*").each((i, el) => {
    if (!$(el).text().trim() && !$(el).children().length && !$(el).is("meta, link, img, input")) $(el).remove();
  });

  // Normalize whitespace
  return $.html().replace(/\s+/g, " ").trim();
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

// Get the "Show all photos" button and return its HTML, text content, and Playwright locator
export async function getShowPhotosButton(
  page: Page,
  html: string
): Promise<{ html: string; text: string; locator: string } | null> {
  console.log("➜ Looking for 'Show all photos' button...");

  // Scroll to top of the page where the button is located
  console.log("➜ Scroll back to top of the page");
  await smoothScroll(page, "top");
  await randomDelay(500, 1000); // Short delay after scrolling

  // Parse with Cheerio
  const $ = load(html);
  const main = $("main");
  if (main.length === 0) {
    console.log("✘ No <main> tag found.");
    return null;
  }

  // Strategy 1: Look for buttons with common "show photos" text patterns
  const photoTextPatterns = [
    "show all photos",
    "see all photos",
    "all photos",
    "view photos",
    "more photos",
    "show all",
    "photos",
    "view all",
    "see all",
  ];

  let targetButton = null;
  const allButtons = main.find("button, [role='button']").toArray();

  // First try: Find by text content matching common patterns
  for (const button of allButtons) {
    const $button = $(button);
    const buttonText = $button.text().toLowerCase().trim();

    if (photoTextPatterns.some((pattern) => buttonText.includes(pattern))) {
      console.log(`✓ Found button with matching text: "${buttonText}"`);
      targetButton = $button;
      break;
    }
  }

  // Strategy 2: Find button after a sequence of image buttons (gallery)
  if (!targetButton) {
    console.log(" Trying gallery sequence detection strategy...");
    let gallerySequenceCount = 0;

    for (let i = 0; i < allButtons.length - 1; i++) {
      const currentButton = $(allButtons[i]);
      const nextButton = $(allButtons[i + 1]);

      // Check for image/picture in current button
      const hasImage = currentButton.find("img").length > 0 || currentButton.find("picture").length > 0;
      const nextHasNoImage = nextButton.find("img").length === 0 && nextButton.find("picture").length === 0;

      if (hasImage) {
        gallerySequenceCount++;
      }

      if (hasImage && nextHasNoImage && gallerySequenceCount >= 2) {
        // Require at least 2 gallery buttons to confirm it's a gallery section
        const nextText = nextButton.text().trim();
        if (nextText.length > 0) {
          targetButton = nextButton;
          console.log(`✓ Found likely show photos button after gallery sequence with text: "${nextText}"`);
          break;
        }
      }
    }
  }

  // Strategy 3: Look for buttons within a container that has multiple images
  if (!targetButton) {
    console.log("➜ Trying container-based detection strategy...");
    const imageSections = main.find("section, div").filter(function (this: cheerio.Element) {
      return $(this).find("img").length >= 3; // Sections with multiple images are likely galleries
    });

    for (const section of imageSections.toArray()) {
      const $section = $(section);
      const buttons = $section.find("button, [role='button']").toArray();

      // Check the last button in the section - often the "show more" button
      if (buttons.length > 0) {
        const lastButton = $(buttons[buttons.length - 1]);
        const buttonText = lastButton.text().trim();

        if (buttonText.length > 0 && !lastButton.find("img").length) {
          targetButton = lastButton;
          console.log(`✓ Found button in image gallery section with text: "${buttonText}"`);
          break;
        }
      }
    }
  }

  if (!targetButton) {
    console.log("✘ Could not identify the 'Show all photos' button.");
    return null;
  }

  // Generate multiple locator strategies for Playwright
  const buttonText = targetButton.text().trim();
  const buttonClass = targetButton.attr("class") || "";

  // Create a robust locator that Playwright can use
  let locator = "";

  // Strategy 1: By text content (most reliable)
  if (buttonText) {
    locator = `//main//button[contains(normalize-space(.), '${buttonText}')]`;
  }
  // Strategy 2: By button position if it has a class
  else if (buttonClass) {
    locator = `//main//button[contains(@class, '${buttonClass}')]`;
  }
  // Fallback strategy: Try to find by structure
  else {
    // Find the button's index among siblings
    const parent = targetButton.parent();
    const siblings = parent.children();
    const index = siblings.index(targetButton);

    if (parent.length && index !== -1) {
      const parentTag = parent.prop("tagName").toLowerCase();
      locator = `//main//${parentTag}/button[${index + 1}]`;
    } else {
      // Last resort - try to find by a generic XPath for a button without images
      locator = `//main//button[not(.//img) and not(.//picture) and string-length(normalize-space(.)) > 0]`;
    }
  }

  return {
    html: targetButton.html() || "",
    text: buttonText || "Show Photos Button",
    locator: locator,
  };
}

// Attempt to load the photo gallery by clicking the "Show all photos" button
// Returns true if gallery was successfully loaded, false otherwise
export async function loadGallery(
  page: Page,
  showPhotosButton: { html: string; text: string; locator: string }
): Promise<boolean> {
  let clickSuccess = false;
  const maxClickAttempts = 3;

  for (let attempt = 1; attempt <= maxClickAttempts; attempt++) {
    try {
      console.log(`➜ Attempt ${attempt}/${maxClickAttempts}: Clicking on "${showPhotosButton.text}" button`);

      // First make sure the element is visible and clickable
      await page.waitForSelector(showPhotosButton.locator, {
        state: "visible",
        timeout: 5000,
      });

      // Use a more robust click method with position targeting center of element
      await page.click(showPhotosButton.locator, {
        force: false, // Don't force click if not clickable
        timeout: 5000, // 5 second timeout for click operation
        delay: 100, // Small delay between mousedown and mouseup
      });

      // Wait for gallery modal to appear - look for common selectors of photo galleries
      console.log("➜ Waiting for photo gallery to load...");
      await Promise.race([
        page.waitForSelector("div[role='dialog']", { timeout: 5000 }),
        page.waitForSelector("div.pswp__zoom-wrap", { timeout: 5000 }),
        page.waitForSelector("[aria-label='Image gallery']", { timeout: 5000 }),
      ]);

      console.log("✓ Successfully clicked button and detected gallery load");
      clickSuccess = true;
      break;
    } catch (clickError: unknown) {
      // Convert unknown error to a format where we can safely access the message property
      const errorMessage = clickError instanceof Error ? clickError.message : String(clickError);
      console.warn(`⚠️ Click attempt ${attempt} failed:`, errorMessage);

      if (attempt === maxClickAttempts) {
        console.error("✘All click attempts failed. Continuing without gallery photos.");
      } else {
        console.log("➜ Retrying after short delay...");
        await randomDelay(1000, 2000);

        // Refresh the page HTML and try to find the button again with updated DOM
        if (attempt === 2) {
          console.log("➜ Refreshing page content to find updated button...");
          const currentHtml = await page.content();
          const refreshedButton = await getShowPhotosButton(page, currentHtml);

          if (refreshedButton) {
            console.log(`✓ Button found with page refresh and updated DOM, with text: ${refreshedButton.text}`);
            showPhotosButton.locator = refreshedButton.locator;
          }
        }
      }
    }
  }

  // If we successfully loaded the gallery, wait a bit more to ensure content is fully loaded
  if (clickSuccess) {
    await randomDelay(2000, 3000);
  }

  return clickSuccess;
}
