import { getBrandingIdentity, getEnrichedDescription, getTopGuestReviews, getTopReviewsText } from "./helpers";
import { ListingBrand, ListingData, RefinedData } from "./types";

/**
 * Takes the raw Airbnb listing data and refines the critical information
 * like Branding Identity, Listing description (if too short), Top reviews etc. to bi saved to the refines table.
 * @param {object} listingData - The full JSON object from the listing-data.json file.
 * @returns {object} A refined object containing essential, structured information.
 */
export async function getRefinedData(listingData: ListingData): Promise<RefinedData | null> {
  if (!listingData || !listingData.listing) {
    return null;
  }

  /* Branding Identity (using LLM and existing information with helper functions)
    {
      "brandName": "The Grove Sanctuary",
      "tagline": "Your private oasis in the heart of Miami.",
      "brandVibe": "Tranquil & Natural",
      "keywords": ["secluded garden", "walkable", "Coconut Grove", "peaceful retreat"]
    }
  */

  // Create a ListingBrand object from the listing data
  const listingBrand: ListingBrand = {
    title: listingData.listing.title,
    subtitle: listingData.listing.subtitle,
    description: listingData.listing.description,
    tags: listingData.listing.tags.join(", "),
  };

  // Generate branding identity
  let brandingIdentity = null;
  try {
    brandingIdentity = await getBrandingIdentity(listingBrand);
    console.log("✔ Successfully generated branding identity");
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("❌ Failed to generate branding identity:", errorMessage);
    return null;
  }

  // If we don't have branding identity, we can't return a valid RefinedData object
  if (!brandingIdentity) {
    return null;
  }

  // Get top reviews (with empty array fallback to satisfy the RefinedData type)
  const topReviews = listingData.reviews ? getTopGuestReviews(listingData.reviews) || [] : [];
  const topReviewsText = getTopReviewsText(topReviews);

  // if description is under 150 words, add content to reach 300+ words
  const description = listingData.listing.description;
  let descriptionRefined = null;
  if (description.length < 150) {
    descriptionRefined = await getEnrichedDescription(listingData.listing, topReviewsText);
  }

  return {
    brandingIdentity,
    topReviews,
    description: descriptionRefined || null,
  };
}
