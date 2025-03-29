// Import all types from the types file
import { getNestedValue, findNestedObjectByPropValue } from "@/utils/helpers";
import { AirbnbApiData, ListingData } from "./types";

// In case AirBnb change the data structrue, update the selectors below --------------------------------------------------------------------------- :
// Main API response ApiData object properties/selectors used for extraction ---------------------------------------------------------------------- :
// Some additional properties are nested objects in these selectors and are used in the extraction functions below ----------------------------------- :

const apiResponseSelectors = {
  // api endpoint: /api/v2/get-data-layer-variables
  LISTING_TYPE: "propertyType", // listing type
  PRIVACY_TYPE: "roomType", // privacy type
  LISTING_TAGS: "categoryTags", // listing tags
  // api endpoint: /api/v3/StaysPdpSections
  LISTING_TITLE: "listingTitle", // listing main page title
  LISTING_SUBS: "sbuiData", // subtitle, capacity highlights
  SEO_FEATURES: "seoFeatures", // listing id, canonical url
};

/**
 * Transforms raw Airbnb API data into structured property listing data
 * following the schema.json blueprint
 * @param apiData The raw API data from Airbnb endpoints
 * @returns Structured property listing data matching our schema.json or null if transformation fails
 */
export function getListingData(apiData: AirbnbApiData): ListingData | null {
  // ApiData nested objects and selectors used for extraction -------------------------------------------- :

  // Direct selectors **********
  const listingTitle = getNestedValue(apiData, apiResponseSelectors.LISTING_TITLE) as string | null;
  if (!listingTitle) {
    console.error("❌ No listing title found");
    return null;
  }

  const listingType = getNestedValue(apiData, apiResponseSelectors.LISTING_TYPE) as string | null;
  if (!listingType) {
    console.error("❌ No listing type found");
    return null;
  }

  const privacyType = getNestedValue(apiData, apiResponseSelectors.PRIVACY_TYPE) as string | null;
  if (!privacyType) {
    console.error("❌ No listing privacy/room type found");
    return null;
  }

  const listingTags = getNestedValue(apiData, apiResponseSelectors.LISTING_TAGS) as string[] | null;
  if (!listingTags) {
    console.error("❌ No listing tags found");
    return null;
  }

  // Indirect selectors **********

  // listing id, url
  const seoFeaturesData = getNestedValue(apiData, apiResponseSelectors.SEO_FEATURES) as Record<string, unknown> | null;
  if (!seoFeaturesData) {
    console.error("❌ No ${apiResponseSelectors.SEO_FEATURES} listing selector data found");
    return null;
  }

  // listing subtitle, capacity highlights
  const sbuiData = getNestedValue(apiData, apiResponseSelectors.LISTING_SUBS) as Record<string, unknown> | null;
  if (!sbuiData) {
    console.error(`❌ No ${apiResponseSelectors.LISTING_SUBS} listing selector data found`);
    return null;
  }

  // Find section object by typename *************

  // Listing Highlights Section object
  const listingHighlightsSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    "PdpHighlightsSection"
  );
  if (!listingHighlightsSection) {
    console.error("❌ No listing highlights section found");
    return null;
  }

  // Listing Description Section object
  const listingDescriptionSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    "PdpDescriptionSection"
  );
  if (!listingDescriptionSection) {
    console.error("❌ No listing description section found");
    return null;
  }

  // Extract listing section data  ------------------------------------------------------------------- :

  // Extract main listing data
  const mainListingData = extractListingData(
    seoFeaturesData,
    listingType,
    privacyType,
    listingTitle,
    sbuiData,
    listingHighlightsSection,
    listingDescriptionSection,
    listingTags
  );
  if (!mainListingData) {
    console.error("❌ Failed to extract listing data");
    return null;
  }

  const listingData = {
    listing: mainListingData,
    // location: extractLocationData(apiData),
    // host: extractHostData(apiData),
    // capacity: extractCapacityData(apiData),
    // pricing: extractPricingData(apiData),
    // availability: extractAvailabilityData(apiData),
    // amenities: extractAmenitiesData(apiData),
    // images: extractImagesData(apiData),
    // reviews: extractReviewsData(apiData),
    // booking_availability: extractBookingAvailabilityData(apiData),
    // cancellation_policy: extractCancellationPolicyData(apiData),
    // check_in_instructions: extractCheckInInstructionsData(apiData),
    // accessibility_features: extractAccessibilityFeaturesData(apiData),
    // listing_expectations: extractListingExpectationsData(apiData),
    // locale_details: extractLocaleDetailsData(apiData),
    // seo: extractSeoData(apiData),
    // additional_rules: extractAdditionalRulesData(apiData),
  };

  return listingData;
}

// Helper functions

// Extract listing data from API response ApiData object segments
function extractListingData(
  seoFeaturesData: Record<string, unknown>,
  type: string,
  privacy: string,
  title: string,
  sbuiData: Record<string, unknown>,
  listingHighlightsSection: Record<string, unknown>,
  listingDescriptionSection: Record<string, unknown>,
  tags: string[]
) {
  // extract listing canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973)
  const url = seoFeaturesData["canonicalUrl"] as string | null;
  if (!url) {
    console.error("❌ No canonicalUrl found");
    return null;
  }

  // extract listing id from canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973 -> 30397973)
  const id = url.split("/").pop();
  if (!id) {
    console.error("❌ No listingId found");
    return null;
  }

  // extract listing subtitle from sbuiData
  const subtitle = getNestedValue(sbuiData, "title") as string | null;
  if (!subtitle) {
    console.error("❌ No subtitle property selector 'title' found");
    return null;
  }

  // extract capacity highlights from sbuiData
  const capacityHighlightsItems = getNestedValue(sbuiData, "overviewItems") as Record<string, unknown>[] | null;
  if (!capacityHighlightsItems) {
    console.error("❌ No capacity highlights property selector 'overviewItems' found");
    return null;
  }

  // extract capacity highlights from capacityHighlightsItems
  const capacity = capacityHighlightsItems.map((item) => item["title"] as string);
  if (!capacity) {
    console.error("❌ No capacity highlights found");
    return null;
  }

  // extract listing highlights from listingHighlightsSection
  const listingHighlightsObject = listingHighlightsSection?.highlights as Record<string, unknown>[] | null;
  if (!listingHighlightsObject) {
    console.error("❌ No listing highlights found");
    return null;
  }

  const highlights = listingHighlightsObject.map((highlight) => {
    return { title: highlight["title"] as string, subtitle: highlight["subtitle"] as string };
  });

  if (!highlights) {
    console.error("❌ No listing highlights found");
    return null;
  }

  // extract listing description from listingDescriptionSection
  const descriptionObject = listingDescriptionSection?.htmlDescription as Record<string, unknown> | null;
  if (!descriptionObject) {
    console.error("❌ No listing description found");
    return null;
  }

  const description = descriptionObject["htmlText"] as string | null;
  if (!description) {
    console.error("❌ No property description found");
    return null;
  }

  const listingData = {
    id,
    url,
    type,
    privacy,
    title,
    subtitle,
    capacity,
    highlights,
    description,
    tags,
  };

  return listingData;
}
