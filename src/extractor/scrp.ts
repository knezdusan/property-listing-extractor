import { extractMetaData } from "./xtrct";
import { getPage } from "./plwrt";
import { getWithRetry } from "@/utils/helpers";
import { clearHtml } from "./helpers";

/**
 * function function scrp(url: string): Promise<string | null>
 * Use Playwright to extract AirBnB property listing data
 * @param url URL of the listing
 * @returns  string for now
 */
export async function scrp(url: string): Promise<string | null> {
  // Initialize variables outside the try block so they're accessible in finally
  let browserInstance = null;
  let contextInstance = null;

  try {
    const playwrightResult = await getWithRetry(() => getPage(url), 3, "Getting page");

    if (!playwrightResult) {
      throw new Error("✘ Failed to initialize Playwright");
    }

    const { browser, context, page } = playwrightResult;

    // Save references for cleanup in finally block
    browserInstance = browser;
    contextInstance = context;

    if (!page) {
      throw new Error("✘ Failed to load page content with Playwright");
    }

    // Extract property listing data ---------------------------------------------------
    console.log("➜ Extracting property listing data...");

    // ----- Extract property metadata
    const listingData = await extractMetaData(page);
    if (!listingData) {
      throw new Error("✘ Failed to extract property listing data");
    }

    // ----- Extract property listing data using OpenAI LLM

    // Extract only the <body> content
    const bodyHTML = await page.evaluate(() => {
      return document.body.outerHTML;
    });

    // Reduce HTML body content size with Cheerio (for LLM) to remove scripts, styles, and other non-content elements
    const reducedHtml = clearHtml(bodyHTML);
    console.log(`Reduced from ${bodyHTML.length} to ${reducedHtml.length} characters`);

    // Use OpenAI LLM to extract property listing data
    // const llmResult = await getWithRetry(() => extractListingData(reducedHtml), 3, "Extracting property listing data with LLM");
    // if (!llmResult) {
    //   throw new Error("✘ Failed to extract property listing data with LLM");
    // }

    return JSON.stringify(listingData);
  } catch (error) {
    console.error("✘ Failed to extract property listing data", error);
    return null;
  } finally {
    // Close the browser to avoid resource leaks, but only if they were initialized
    if (contextInstance) {
      await contextInstance.close();
    }
    if (browserInstance) {
      await browserInstance.close();
      console.log("➜ Browser closed");
    }
  }
}
