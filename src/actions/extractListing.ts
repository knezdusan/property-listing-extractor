"use server";

import { scrp } from "@/extractor/scrp";
import { formatListingUrl, validateAirbnbUrl } from "@/extractor/helpers";

export async function extractListing(prevData: string, formData: FormData): Promise<string> {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Extracting listing data...");

  // Use the URL provided by the form, (or fall back if exists to test URL if empty)
  let listingUrl = formData.get("url") as string;

  // Ensure it's a non-empty string
  if (typeof listingUrl !== "string" || listingUrl.trim() === "") {
    throw new Error("❌ Empty Airbnb property listing URL provided");
  }

  // If url is valid Airbnb url, extract the listing ID
  const listingId = validateAirbnbUrl(listingUrl);
  if (!listingId) {
    throw new Error("❌ Invalid Airbnb property listing URL provided");
  }

  // Create a new URL with the listing ID and mandatory format https://www.airbnb.com/rooms/{listingId}?query-string
  // the query string includes the check-in and check-out dates, guests, adults, children, infants, pets to extract all API data
  listingUrl = formatListingUrl(listingId);
  if (!listingUrl) {
    throw new Error("❌ Failed to format listing URL");
  }

  // listingUrl = "https://www.airbnb.com/rooms/1089599548357132872";

  // --------------------------------------------------- Use Scraper function
  try {
    const listingData = await scrp(listingUrl);

    if (!listingData) {
      throw new Error("❌ Failed to extract listing data");
    }

    console.log("✔ Succesfully extracted data from the listing", listingData);
  } catch (error) {
    console.error("❌ Failed to extract listing data:", error);
    return "~~~~~~~~~~~~~~~~~~~~~~~~~ false :(";
  }

  return ">>>>>>>>>>>>>>>>>>>>>>>> yes! :)";
}
