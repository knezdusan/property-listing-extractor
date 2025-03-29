import { getPageData } from "./getPageData";
import { getPropertyData } from "./transformer";
import { getWithRetry, removeNestedValue, saveToFile } from "@/utils/helpers";

/**
 * function function scrp(url: string): Promise<string | null>
 * Use Playwright to extract AirBnB property listing data
 * @param url URL of the listing
 * @returns  string for now
 */
export async function scrp(url: string): Promise<string | null> {
  try {
    const apiData = await getWithRetry(() => getPageData(url), 3, "Getting page apiData from Api endpoints");

    if (!apiData) {
      throw new Error("❌ Failed to extract API data with Playwright");
    }

    // Remove "screens" property from apiData
    if (removeNestedValue(apiData, "screens")) {
      console.log("✔ Successfully removed 'screens' property from apiData");
    } else {
      console.error("❌ Failed to remove 'screens' property from apiData");
    }

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

    return "listing data to be extracted";
  } catch (error) {
    console.error("❌ Failed to extract property listing data", error);
    return null;
  }
}
