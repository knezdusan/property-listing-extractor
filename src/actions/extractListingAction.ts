"use server";

import { scrp } from "@/extractor/scrp";
import { formatListingUrl } from "@/extractor/helpers";
import { getAuth } from "@/utils/auth";
import { airbnbUrlIdSchema } from "@/utils/zod";
import { ActionResponse } from "@/types";

export async function extractListingAction(): Promise<ActionResponse> {
  console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Extracting listing data...");

  // Check if the user is authenticated and get the property listing id
  const authPayload = await getAuth();

  if (!authPayload) {
    console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Failed to get auth payload");
    return {
      success: false,
      message: "Your current session has expired. Please repeat the process.",
    };
  }

  // The auth session id is the property listing id
  const listingId = authPayload.id;

  // Validate the listing id
  const validatedListingId = airbnbUrlIdSchema.safeParse(listingId);
  if (!validatedListingId.success) {
    console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Invalid listing ID");
    return {
      success: false,
      message: "Invalid listing ID, please repeat the process.",
    };
  }

  // Create a new URL with the listing ID and mandatory format https://www.airbnb.com/rooms | h/{listingId}?query-string
  // the query string includes the check-in and check-out dates, guests, adults, children, infants, pets to extract all API data
  const listingUrl = formatListingUrl(listingId);
  if (!listingUrl) {
    console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Failed to format listing URL");
    return {
      success: false,
      message: "Failed to format listing URL, please repeat the process.",
    };
  }

  // listingUrl = "https://www.airbnb.com/rooms/1089599548357132872";

  // --------------------------------------------------- Use Scraper function
  try {
    const listingData = await scrp(listingUrl);

    if (!listingData) {
      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Listing data extraction failed");
      return {
        success: false,
        message: "Failed to extract listing data, please repeat the process.",
      };
    }

    console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Listing data extraction successful");
    return {
      success: true,
      message: "✔ Succesfully extracted data from the listing",
    };
  } catch (error) {
    console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Listing data extraction failed");
    return {
      success: false,
      message: `❌ Failed to extract listing data: ${error}`,
    };
  }
}
