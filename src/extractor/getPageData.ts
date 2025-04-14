import { firefox } from "playwright";
import { getProxyData } from "./proxy";
import { getWithRetry, randomDelay } from "@/utils/helpers";
import { closePopups, locateAndScrollToReviewsButton, findReviewsNumber, loadAllReviews } from "./helpers";
import { EXTRACTION_API_ENDPOINTS_ARRAY, HTML_SELECTORS, EXTRACTION_API_ENDPOINTS } from "./selectors";

/**
 * Setup Playwright with proxy and extract API data from AirBnB listing API endpoints responses
 * @param url URL of the listing
 * @returns apiData - intercepted API response data
 */
export async function getPageData(url: string): Promise<Record<string, unknown> | null> {
  console.log("➜➜➜➜ Setting up Playwright...");

  // Get proxy data { server, username, password, language, locale, timezone, acceptLanguage } ---------
  const proxyData = await getWithRetry(getProxyData, 3, "Getting proxy data");

  if (!proxyData) {
    console.error("❌ No proxy data available");
    return null;
  }

  const { server, username, password, locale, timezone, acceptLanguage } = proxyData;

  // Playwright - Browser -----------------------------------------------------------------------------

  // Launch browser in non-headless mode for visual tracking
  const browser = await firefox.launch({
    headless: false,
    timeout: 30000,
    slowMo: 100,
  });

  // Create a new context with the proxy configuration
  const context = await browser.newContext({
    proxy: {
      server: server,
      username: username,
      password: password,
    },
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: locale,
    timezoneId: timezone,
    httpCredentials: {
      username,
      password,
    },
    // Basic evasion techniques (can be expanded later based on testing)
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    extraHTTPHeaders: {
      "Accept-Language": acceptLanguage,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      DNT: "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  try {
    console.log(`➜ Navigating to ${url}`);
    const page = await context.newPage();

    // API Interception and Data Extraction
    console.log("➜ Intercepting calls from API endpoints...");
    const apiData: Record<string, unknown> = {};

    // Get array of API endpoints from config
    const apiEndpoints: string[] = EXTRACTION_API_ENDPOINTS_ARRAY;

    // Store original request headers for potential re-fetching
    const originalRequestHeaders: Record<string, Record<string, string>> = {};

    // Capture request headers for potential re-fetching
    page.on("request", (request) => {
      for (const endpoint of apiEndpoints) {
        if (request.url().includes(endpoint)) {
          originalRequestHeaders[endpoint] = request.headers();
        }
      }
    });

    page.on("response", async (response) => {
      const url = response.url();

      for (const endpoint of apiEndpoints) {
        if (url.includes(endpoint)) {
          try {
            // Special handling for the problematic reviews endpoint
            if (endpoint === EXTRACTION_API_ENDPOINTS.reviews) {
              // Implement retry logic for direct fetch
              const maxRetries = 3;
              let retryCount = 0;
              let success = false;

              while (retryCount < maxRetries && !success) {
                try {
                  // Get headers from the original request if available
                  const headers = originalRequestHeaders[endpoint] || {};

                  // Make a direct request using Playwright's request API
                  const apiResponse = await page.request.get(url, {
                    headers: headers,
                  });

                  // Process the response body
                  const text = await apiResponse.text();
                  const json = JSON.parse(text);

                  if (json) {
                    apiData[endpoint] = apiData[endpoint] ? mergeData(apiData[endpoint], json) : json;
                    console.log(
                      `✓ Successfully fetched and processed ${endpoint} data directly (attempt ${
                        retryCount + 1
                      }/${maxRetries})`
                    );
                    success = true;
                  }
                } catch (directFetchError) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.warn(
                      `⚠ Attempt ${retryCount}/${maxRetries} failed for ${endpoint}: ${
                        directFetchError instanceof Error ? directFetchError.message : directFetchError
                      }`
                    );
                    // Exponential backoff with jitter
                    const backoffTime = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
                    console.log(`⏱ Retrying in ${Math.round(backoffTime / 1000)} seconds...`);
                    await page.waitForTimeout(backoffTime);
                  } else {
                    console.error(`❌ All ${maxRetries} retry attempts failed for ${endpoint}:`, directFetchError);
                  }
                }
              }
            } else {
              // Normal handling for other endpoints
              const json = await response.json().catch(() => null);
              if (json) {
                apiData[endpoint] = apiData[endpoint] ? mergeData(apiData[endpoint], json) : json;
              } else {
                console.log(`Failed to parse JSON for ${endpoint}, response status: ${response.status()}`);
              }
            }
          } catch (error) {
            console.error(`❌ Error processing response from ${endpoint}:`, error);
          }
        }
      }
    });

    // Set some basic evasion against bot detection
    await page.addInitScript(() => {
      // Mask webdriver property
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // Navigate to the listing URL with network idle
    console.log("➜ Loading page and waiting for network to be idle...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    // Instead of waiting for specific selectors, we'll use a multi-pronged approach
    console.log("➜ Waiting for content to load...");

    // 1. Wait for initial load with domcontentloaded
    await page.waitForLoadState("domcontentloaded");

    // 2. Ensure page has main content by checking for common elements
    // Instead of specific selectors, check for content that should exist on any listing
    console.log("➜ Checking for main content...");
    await page
      .waitForFunction(
        () => {
          // Check if the page contains common elements like images, headings, and price info
          const hasImages = document.querySelectorAll("img").length > 5;
          const hasHeadings = document.querySelectorAll("h1, h2, h3").length > 2;

          // Check for price-related content (currency symbols)
          const priceRegex = /(\$|€|£|¥|₹|₽|₩|A\$|C\$|HK\$|R\$)/;
          const textContent = document.body.textContent || "";
          const hasPriceContent = priceRegex.test(textContent);

          // Check general content loading
          const hasSubstantialContent = document.body.textContent && document.body.textContent.length > 5000;

          return hasImages && hasHeadings && hasPriceContent && hasSubstantialContent;
        },
        { timeout: 30000 }
      )
      .catch(() => {
        console.log("➜ Content check timed out, continuing anyway...");
      });

    // Add a small delay to wait for any popup or modal to appear
    await randomDelay(3000, 5000);

    // Close any popups or modals that might have appeared on page load
    await closePopups(page);

    // Add a small delay to ensure dynamic content loads
    await randomDelay(2000, 3000);

    // Scroll down to trigger lazy loading content
    console.log("➜ Scrolling to load dynamic content...");

    // Use a smoother scroll-down approach to mimic human behavior
    await page.evaluate(async () => {
      // Define a sleep function within the browser context
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      // Get total height of page
      const totalHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollSteps = 6; // Number of scrolling steps

      // Scroll down in steps to trigger lazy loading
      for (let i = 1; i <= scrollSteps; i++) {
        const scrollPosition = (i / scrollSteps) * (totalHeight - viewportHeight);
        window.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
        // Wait between scrolls with random delay between 500-1000ms
        await sleep(500 + Math.random() * 500);
      }

      // Final scroll to ensure we reach the bottom
      window.scrollTo(0, totalHeight);
      await sleep(2000 + Math.random() * 1000);
    });

    // Find the reviews number on page and log it
    const reviewsNumber = await findReviewsNumber(page);
    if (!reviewsNumber) {
      console.log("❌ Reviews number not found");
      return null;
    }

    console.log(`✔ Found reviews number: ${reviewsNumber}`);

    // As we catch all the reviws under 24 with initial API call
    // we proceed extracting reviews from the reviews modal only if reviewsNumber > 24
    if (reviewsNumber > 24) {
      // Locate the reviews button and scroll into view using the helper
      const reviewsButtonLocator = await locateAndScrollToReviewsButton(page);

      if (reviewsButtonLocator) {
        try {
          console.log("➜ Clicking reviews button...");
          // Use force: true cautiously if clicks are sometimes missed due to overlays
          await reviewsButtonLocator.click({ timeout: 5000 });
          await randomDelay(1500, 2500); // Wait after click for modal to potentially open/load

          // Load all reviews using the helper function
          await loadAllReviews(page, HTML_SELECTORS.REVIEWS_MODAL, HTML_SELECTORS.REVIEW);

          // if loadAllReviews returns null, return null
          if (!apiData[EXTRACTION_API_ENDPOINTS.reviews]) {
            console.error("❌ Reviews data not extracted from the reviews modal.");
            return null;
          }
        } catch (error) {
          console.error(`❌ Error interacting with reviews button: ${error instanceof Error ? error.message : error}`);
          return null;
        }
      } else {
        console.log("❌ Reviews button not found, cannot click to open modal.");
        return null;
      }
    }

    // Final wait for any triggered lazy-loaded content or modal transitions
    console.log("➜ Final wait before concluding page interaction...");
    await randomDelay(2000, 4000);

    return apiData;
  } catch (error) {
    console.error("❌ Error during extraction:", error);
    // Close the browser to avoid resource leaks
    await context.close();
    await browser.close();
    return null;
  } finally {
    // Close the browser to avoid resource leaks
    await context.close();
    await browser.close();
  }
}

// helper function to merge Data ---------------------------------------------------------------
function mergeData(existing: unknown, incoming: unknown): unknown {
  if (isObject(existing) && isObject(incoming)) {
    const merged = { ...existing };
    for (const key in incoming) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        merged[key] = mergeData(existing[key], incoming[key]);
      }
    }
    return merged;
  }
  if (Array.isArray(incoming)) {
    return Array.isArray(existing) ? [...existing, ...incoming] : incoming;
  }
  return incoming;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
