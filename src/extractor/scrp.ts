import { extractMetaData } from "./xtrct";
import { getPage } from "./plwrt";

/**
 * function function scrp(url: string): Promise<string>
 * Use Playwright to extract AirBnB property listing data
 * @param url URL of the listing
 * @returns  string for now
 */
export async function scrp(url: string): Promise<string> {
  // Initialize variables outside the try block so they're accessible in finally
  let browserInstance = null;
  let contextInstance = null;

  try {
    const result = await getPage(url);

    if (!result) {
      console.error("✘ Failed to initialize browser");
      return "";
    }

    const { browser, context, page } = result;

    // Save references for cleanup in finally block
    browserInstance = browser;
    contextInstance = context;

    if (!page) {
      console.error("✘ Failed to load page content with Extractor");
      return "";
    }

    // Extract property listing data
    console.log("➜ Extracting property listing data...");
    const listingData = await extractMetaData(page);
    if (!listingData) {
      console.error("✘ Failed to extract property listing data");
      return "";
    }

    return JSON.stringify(listingData);
  } catch (error) {
    console.error("✘ Failed to extract property listing data", error);
    return "";
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
