import { firefox, type Browser, type BrowserContext, type Page } from "playwright";
import { getProxyData } from "./proxy";
import { randomDelay } from "@/utils/helpers";
import path from "path";
import { writeFile } from "fs/promises";

/**
 * Setup Playwright with proxy
 * @returns Browser, Context and Page instances
 */
export async function getPage(url: string): Promise<{ browser: Browser; context: BrowserContext; page: Page } | null> {
  console.log("➜➜➜➜ Setting up Playwright...");

  // Get proxy data -----
  const proxyData = await getProxyData();

  if (!proxyData) {
    console.error("✘ No proxy data available");
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

      // Scroll back up a bit to mimic natural reading behavior
      window.scrollTo({
        top: totalHeight * 0.7,
        behavior: "smooth",
      });
    });

    // Final wait for any triggered lazy-loaded content
    await randomDelay(2000, 3000);

    // Extract the full HTML content
    console.log("➜ Extracting HTML content...");
    const html = await page.content();

    // Save the property listing main page HTML to src/data/listing.html
    const filePath = path.join(process.cwd(), "src/extractor/data/listing.html");
    await writeFile(filePath, html);
    console.log(`✔ Saved HTML content to ${filePath}`);

    return { browser, context, page };
  } catch (error) {
    console.error("✘ Error during extraction:", error);
    // Close the browser to avoid resource leaks
    await context.close();
    await browser.close();
    return null;
  }
}
