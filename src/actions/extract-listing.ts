"use server";

import { shuffleArray } from "@/utils/helpers";
import { scrp } from "@/extractor/scrp";

export async function extractListing(previousData: string, formData: FormData): Promise<string> {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Extracting listing data...");

  // Use the URL provided by the form, or fall back to test URL if empty
  let listingUrl = formData.get("url") as string;

  // Sample listing URLs for testing
  const sampleListingUrls = [
    "https://www.airbnb.com/rooms/54224514",
    "https://www.airbnb.com/rooms/22382672",
    "https://www.airbnb.com/rooms/53478370",
    "https://www.airbnb.com/rooms/1365865975375373285",
    "https://www.airbnb.com/rooms/48023999",
    "https://www.airbnb.com/rooms/17084120",
  ];

  if (!listingUrl) {
    listingUrl = shuffleArray(sampleListingUrls)[0];
  }

  // listingUrl = "https://www.airbnb.com/rooms/1089599548357132872";

  // --------------------------------------------------- Use Scraper function
  try {
    const listingData = await scrp(listingUrl);

    if (!listingData) {
      throw new Error("✘ Failed to extract listing data");
    }

    console.log("✔ Succesfully extracted data from the listing", listingData);
  } catch (error) {
    console.error("✘ Failed to extract listing data:", error);
    return "~~~~~~~~~~~~~~~~~~~~~~~~~ false :(";
  }

  return ">>>>>>>>>>>>>>>>>>>>>>>> yes! :)";
}
