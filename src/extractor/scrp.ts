import { getListingData } from "./getListingData";
import { getPageData } from "./getPageData";
import { getWithRetry, saveToFile } from "@/utils/helpers";
import { LISTING_DATA_PATHS } from "./selectors";
import { saveListingData, removeNestedValue } from "./helpers";

/**
 * function scrp(url: string): Promise<string | null>
 * Use Playwright to extract AirBnB property listing data
 * and save to data folder and supabase db
 * @param url URL of the listing
 * @returns  string for now
 */
export async function scrp(url: string): Promise<string | null> {
  try {
    console.log("\n➜➜➜➜➜ Storing apiData, listingData, and upserting to supabase...");
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
    const listingData = await getListingData(apiData);
    if (listingData) {
      console.log("✔ Successfully transformed property listing data from apiData JSON to listingData JSON");

      // Save the listing data to data folder
      console.log("➜ Saving listing data JSON to data folder");
      await saveToFile(JSON.stringify(listingData), LISTING_DATA_PATHS.listingData);

      // Upsert the listing data to supabase
      if (await saveListingData(listingData)) {
        console.log("✔ Successfully upserted property listing data to supabase");
      } else {
        console.error("❌ Failed to upsert property listing data to supabase");
      }
    } else {
      console.error("❌ Failed to transform property listing data from apiData JSON to listingData JSON");
    }

    return "listing data to be extracted";
  } catch (error) {
    console.error("❌ Failed to extract property listing data", error);
    return null;
  }
}
