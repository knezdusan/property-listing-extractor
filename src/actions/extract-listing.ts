"use server";

import { fetchRandomProxies } from "@/utils/proxy";
import { sampleListingUrls, shuffleArray } from "@/utils/helpers";
import { scrp } from "@/utils/scrp";
import { writeFile } from "fs/promises";
import path from "path";

export async function extractListing(previousData: string, formData: FormData): Promise<string> {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Extracting listing data...");

  // Use the URL provided by the form, or fall back to test URL if empty
  let listingUrl = formData.get("url") as string;
  if (!listingUrl) {
    listingUrl = shuffleArray(sampleListingUrls)[0];
  }

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
    const html = await scrp(listingUrl, proxyPool[0]);

    if (!html) {
      throw new Error("✘ Failed to extract listing data");
    }

    // Save the property listing main page HTML to src/data/data.html
    const filePath = path.join(process.cwd(), "src/data/data.html");
    await writeFile(filePath, html);
    console.log(`✔ Saved HTML content to ${filePath}`);

    console.log("✔ Succesfully extracted data from the listing");
  } catch (error) {
    console.error("✘ Failed to extract listing data:", error);
    return "????????????????????????????? false";
  }

  return "????????????????????????????? true";
}
