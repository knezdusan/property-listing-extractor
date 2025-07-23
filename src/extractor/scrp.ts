import { getApiData } from "./getApiData";
import { getListingData } from "./getListingData";
// import { getPagesData } from "./getPagesData";
import { getWithRetry, saveToFile } from "@/utils/helpers";
import { LISTING_DATA_PATHS } from "./selectors";
import { removeNestedValue } from "./helpers";
import saveListingData from "./saveListingData";
import { getRefinedData } from "./getRefinedData";
import saveRefinedData from "./saveRefinedData";

/**
 * function scrp(url: string): Promise<string | null>
 * Use Playwright to extract AirBnB property listing data
 * and save to data folder and supabase db
 * @param url URL of the listing
 * @returns  string for now
 */
export async function scrp(url: string): Promise<string | null> {
  try {
    /**
     * 1. Get the row apiData from the listing page,
     *    - remove "screens" property from apiData to clear the data,
     *    - save the apiData JSON to data folder as api-data.json,
     *    - upsert the apiData to supabase
     *
     * 2. Get the important listingData from the apiData
     *    - save the listingData JSON to data folder as listing-data.json,
     *    - upsert the listingData to supabase
     *
     * 3. Get the refinedData from the listingData
     *    - save the refinedData JSON to data folder as refined-data.json,
     *    - upsert the refinedData to supabase (refines table)
     *
     * 4. Get the pagesData from the listingData using AI LLM functions
     *    - save the pagesData JSON to data folder as pages-data.json,
     *    - upsert the pagesData to supabase (pages table)
     */

    // --- 1. Get the row apiData, save to local json and upsert to supabase ---------------------------------------------
    console.log("\n➜➜➜➜➜ Storing apiData, listingData, and upserting to supabase...");
    const apiData = await getWithRetry(() => getApiData(url), 3, "Getting page apiData from Api endpoints");

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

    // --- 2. Get the important listingData from apiData, save to local json and upsert to supabase ---------------------------------------------
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
        return null;
      }
    } else {
      console.error("❌ Failed to transform property listing data from apiData JSON to listingData JSON");
      return null;
    }

    // --- 3. Refines - Additional listing information to store in the refines table ---------------------------------------------
    const refinedData = await getRefinedData(listingData);
    if (refinedData) {
      console.log("✔ Successfully refined property listing data");

      // Save the refined data to data folder
      console.log("➜ Saving refined data JSON to data folder");
      await saveToFile(JSON.stringify(refinedData), LISTING_DATA_PATHS.refinedData);

      // Upsert the refined data to supabase
      const listingId = listingData.listing.id;
      if (await saveRefinedData(refinedData, listingId)) {
        console.log("✔ Successfully upserted property refined data to supabase");
      } else {
        console.error("❌ Failed to upsert property refined data to supabase");
        return null;
      }
    } else {
      console.error("❌ Failed to refined property listing data");
      return null;
    }

    // --- 5. Generate the pagesData object from the listingData using the AI LLM functions ---------------------------------------------
    // const pagesData = await getPagesData(listingData);
    // if (pagesData) {
    //   console.log("✔ Successfully generated pages data from listing data");

    //   // Save the pages data to data folder
    //   console.log("➜ Saving pages data JSON to data folder");
    //   await saveToFile(JSON.stringify(pagesData), LISTING_DATA_PATHS.pagesData);

    //   // Upsert the pages data to supabase
    //   if (await savePagesData(pagesData)) {
    //     console.log("✔ Successfully upserted pages data to supabase");
    //   } else {
    //     console.error("❌ Failed to upsert pages data to supabase");
    //     return null;
    //   }
    // } else {
    //   console.error("❌ Failed to generate pages data from listing data");
    //   return null;
    // }

    return "listing and pages data successfully extracted";
  } catch (error) {
    console.error("❌ Failed to extract property listing data", error);
    return null;
  }
}
