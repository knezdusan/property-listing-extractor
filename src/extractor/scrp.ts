// import { extractMetaData } from "./xtrct";
import { getPage } from "./plwrt";
import { getWithRetry, saveToFile } from "@/utils/helpers";
// import { clearHtml, getShowPhotosButton, loadGallery } from "./helpers";
import { getPropertyData } from "./transformer";

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

    const { browser, context, page, apiData } = playwrightResult;
    // console.log("➜ API data:", apiData);

    // Save the apiData to src/data/apiData.json
    await saveToFile(JSON.stringify(apiData), "src/extractor/data/apiData.json");

    // Transform the apiData to property data
    const propertyData = getPropertyData(apiData);
    if (propertyData) {
      console.log("✔ Successfully transformed property data from apiData");

      // Save the property data to src/data/propertyData.json
      console.log("➜ Saving property data to propertyData.json");
      await saveToFile(JSON.stringify(propertyData), "src/extractor/data/propertyData.json");
    } else {
      console.error("❌ Failed to transform property data");
    }

    // Save references for cleanup in finally block
    browserInstance = browser;
    contextInstance = context;

    if (!page) {
      throw new Error("✘ Failed to load page content with Playwright");
    }

    // // Extract the full HTML content and save it ---------
    // console.log("➜ Extracting HTML content...");
    // const html = await page.content();

    // // Save the property listing main page HTML to src/data/listing.html
    // await saveToFile(html, "src/extractor/data/listing.html");

    // // Extract property listing data ---------------------------------------------------
    // console.log("➜ Extracting property listing data...");

    // // ----- Extract property metadata
    // const listingData = await extractMetaData(page);
    // if (!listingData) {
    //   throw new Error("✘ Failed to extract property listing data");
    // }

    // // ----- Extract property listing data using OpenAI LLM

    // // Extract only the <main> content without footers
    // const mainHTML = await page.evaluate(() => {
    //   // Get the main element using querySelector
    //   const mainElement = document.querySelector("main");

    //   // Check if main element exists
    //   if (!mainElement) {
    //     return document.body.outerHTML; // Fallback to body if main doesn't exist
    //   }

    //   // Create a clone of the main element
    //   const mainClone = mainElement.cloneNode(true) as HTMLElement;

    //   // Find and remove all footer elements from the clone
    //   const footers = mainClone.querySelectorAll("footer");
    //   footers.forEach((footer) => footer.remove());

    //   // Return the modified HTML
    //   return mainClone.outerHTML;
    // });

    // // Reduce HTML body content size with Cheerio (for LLM) to remove scripts, styles, and other non-content elements
    // const reducedHtml = clearHtml(mainHTML);
    // console.log(`Reduced from ${mainHTML.length} to ${reducedHtml.length} characters`);

    // // Save the property listing reduced HTML to src/data/listing-reduced.html
    // await saveToFile(reducedHtml, "src/extractor/data/listing-reduced.html");

    // Use OpenAI LLM to extract property listing data
    // const llmResult = await getWithRetry(() => extractListingData(reducedHtml), 3, "Extracting property listing data with LLM");
    // if (!llmResult) {
    //   throw new Error("✘ Failed to extract property listing data with LLM");
    // }

    // // ----- Click on the "Show all photos" button and wait for the gallery to load

    // // Get the "Show all photos" button and click it
    // const showPhotosButton = await getShowPhotosButton(page, mainHTML);
    // if (!showPhotosButton) throw new Error("✘ Failed to find 'Show all photos' button");

    // // Click the button and wait for gallery to load
    // const galleryLoaded = await loadGallery(page, showPhotosButton);
    // if (!galleryLoaded) throw new Error("✘ Failed to load photo gallery");

    return "listing data to be extracted";
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
