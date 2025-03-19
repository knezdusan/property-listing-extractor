"use server";

import { fetchRandomProxies } from "@/extractor/proxy";
import { shuffleArray } from "@/utils/helpers";
import { scrp } from "@/extractor/scrp";

export async function extractListing(previousData: string, formData: FormData): Promise<string> {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Extracting listing data...");

  // Use the URL provided by the form, or fall back to test URL if empty
  let listingUrl = formData.get("url") as string;

  // Sample listing URLs for testing
  const sampleListingUrls = [
    "https://www.airbnb.com/rooms/54224514",
    "https://www.airbnb.com/rooms/625479145439568235",
    "https://www.airbnb.com/rooms/53478370",
    "https://www.airbnb.com/rooms/704345975719106602",
    "https://www.airbnb.com/rooms/48023999",
    "https://www.airbnb.com/rooms/30397973",
  ];

  if (!listingUrl) {
    listingUrl = shuffleArray(sampleListingUrls)[0];
  }

  listingUrl = "https://www.airbnb.com/rooms/1089599548357132872";

  // --------------------------------------------------- Fetch proxy pool for rotation
  const proxyPool = await fetchRandomProxies();
  if (!proxyPool.length) {
    console.error("✘ Failed to fetch any proxies");
    return "????????????????????????????? false";
  } else if (proxyPool.length < 3) {
    console.warn(`⚠️ Limited proxy pool: ${proxyPool.length} proxies available`, proxyPool);
  } else {
    console.log(`✔ Successfully fetched ${proxyPool.length} proxies for rotation`, proxyPool);
  }

  // --------------------------------------------------- Use Scraper function
  try {
    const listingData = await scrp(listingUrl, proxyPool[0]);

    if (!listingData) {
      throw new Error("✘ Failed to extract listing data");
    }

    console.log("✔ Succesfully extracted data from the listing", listingData);
  } catch (error) {
    console.error("✘ Failed to extract listing data:", error);
    return "????????????????????????????? false";
  }

  return "????????????????????????????? true";
}
