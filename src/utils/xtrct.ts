/**
 * function extractMetaData(page: Page): Promise<MetaData | null>
 * Helper function that uses Playwright to extract listing meta data
 * {url, title, description, mainImage}
 * @param page Page object from Playwright
 * @returns MetaData object containing extracted data or null if extraction fails
 */

import { Page } from "playwright";

// Define the structure of the data extracted from the DOM
interface MetaData {
  url: string;
  title: string;
  description: string;
  mainImage: string;
}

export async function extractMetaData(page: Page): Promise<MetaData | null> {
  // Use page.evaluate to run DOM queries in the browser context
  const extractedData = await page.evaluate(() => {
    // Extract Title
    const titleElement = document.querySelector("title");
    if (!titleElement) return null;
    const title = titleElement.textContent?.trim() || "";

    // Extract meta information (url, description, and main image from Open Graph (OG) Tags)
    const ogTags: Record<string, string> = {};
    const ogMetaTags = document.querySelectorAll('meta[property^="og:"]');
    if (!ogMetaTags) return null;
    ogMetaTags.forEach((tag: Element) => {
      const property = tag.getAttribute("property")?.replace("og:", "") || "";
      const content = tag.getAttribute("content") || "";
      ogTags[property] = content;
    });

    // Return structured data
    return {
      title,
      ogTags,
    };
  });

  if (!extractedData) return null;

  const response: MetaData = {
    url: extractedData.ogTags.url,
    title: extractedData.title,
    description: extractedData.ogTags.description,
    mainImage: extractedData.ogTags.image,
  };

  return response;
}
