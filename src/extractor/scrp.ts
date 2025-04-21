import { getListingData } from "./getListingData";
import { getPageData } from "./getPageData";
import { getWithRetry, removeNestedValue, saveToFile } from "@/utils/helpers";
import { LISTING_DATA_PATHS } from "./selectors";

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

    // Save the apiData JSON to data folder
    await saveToFile(JSON.stringify(apiData), LISTING_DATA_PATHS.apiData);

    // Transform the apiData to listing data and save listingData JSON to data folder
    const listingData = getListingData(apiData);
    if (listingData) {
      console.log("✔ Successfully transformed property listing data from apiData JSON to listingData JSON");

      // Save the listing data to data folder
      console.log("➜ Saving listing data JSON to data folder");
      await saveToFile(JSON.stringify(listingData), LISTING_DATA_PATHS.listingData);
    } else {
      console.error("❌ Failed to transform property listing data from apiData JSON to listingData JSON");
    }

    return "listing data to be extracted";
  } catch (error) {
    console.error("❌ Failed to extract property listing data", error);
    return null;
  }
}
