// Import all types from the types file
import { getNestedValue, findNestedObjectByPropValue } from "@/utils/helpers";
import { AirbnbApiData, ListingData } from "./types";

// In case AirBnb change the data structrue, update the selectors below --------------------------------------------------------------------------- :
// Main API response ApiData object properties/selectors used for extraction ---------------------------------------------------------------------- :
// Some additional properties are nested objects in these selectors and are used in the extraction functions below ----------------------------------- :

const apiResponseSelectors = {
  // api endpoint: /api/v2/get-data-layer-variables
  PROPERTY_TYPE: "propertyType", // property type
  PRIVACY_TYPE: "roomType", // privacy type
  PROPERTY_TAGS: "categoryTags", // property tags
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

  const propertyType = getNestedValue(apiData, apiResponseSelectors.PROPERTY_TYPE) as string | null;
  if (!propertyType) {
    console.error("❌ No property type found");
    return null;
  }

  const privacyType = getNestedValue(apiData, apiResponseSelectors.PRIVACY_TYPE) as string | null;
  if (!privacyType) {
    console.error("❌ No property privacy/room type found");
    return null;
  }

  const propertyTags = getNestedValue(apiData, apiResponseSelectors.PROPERTY_TAGS) as string[] | null;
  if (!propertyTags) {
    console.error("❌ No property tags found");
    return null;
  }

  // Indirect selectors **********

  // listing id, url
  const seoFeaturesData = getNestedValue(apiData, apiResponseSelectors.SEO_FEATURES) as Record<string, unknown> | null;
  if (!seoFeaturesData) {
    console.error("❌ No ${apiResponseSelectors.SEO_FEATURES} property selector data found");
    return null;
  }

  // listing subtitle, capacity highlights
  const sbuiData = getNestedValue(apiData, apiResponseSelectors.LISTING_SUBS) as Record<string, unknown> | null;
  if (!sbuiData) {
    console.error(`❌ No ${apiResponseSelectors.LISTING_SUBS} property selector data found`);
    return null;
  }

  // Find section object by typename *************

  // Property Highlights Section object
  const propertyHighlightsSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    "PdpHighlightsSection"
  );
  if (!propertyHighlightsSection) {
    console.error("❌ No property highlights section found");
    return null;
  }

  // Property Description Section object
  const propertyDescriptionSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    "PdpDescriptionSection"
  );
  if (!propertyDescriptionSection) {
    console.error("❌ No property description section found");
    return null;
  }

  // Extract listing section data  ------------------------------------------------------------------- :

  // Extract main listing data
  const mainListingData = extractListingData(
    seoFeaturesData,
    propertyType,
    privacyType,
    listingTitle,
    sbuiData,
    propertyHighlightsSection,
    propertyDescriptionSection,
    propertyTags
  );
  if (!mainListingData) {
    console.error("❌ Failed to extract listing data");
    return null;
  }

  // Extract property description
  //   const propertyDescription = extractPropertyDescription(apiData);

  const listingData = {
    listing: mainListingData,
    // description: propertyDescription,
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
  propertyType: string,
  privacyType: string,
  listingTitle: string,
  sbuiData: Record<string, unknown>,
  propertyHighlightsSection: Record<string, unknown>,
  propertyDescriptionSection: Record<string, unknown>,
  propertyTags: string[]
) {
  // extract listing canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973)
  const canonicalUrl = seoFeaturesData["canonicalUrl"] as string | null;
  if (!canonicalUrl) {
    console.error("❌ No canonicalUrl found");
    return null;
  }

  // extract listing id from canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973 -> 30397973)
  const listingId = canonicalUrl.split("/").pop();
  if (!listingId) {
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
  const capacityHighlights = capacityHighlightsItems.map((item) => item["title"] as string);
  if (!capacityHighlights) {
    console.error("❌ No capacity highlights found");
    return null;
  }

  // extract property highlights from propertyHighlightsSection
  const propertyHighlightsObject = propertyHighlightsSection?.highlights as Record<string, unknown>[] | null;
  if (!propertyHighlightsObject) {
    console.error("❌ No property highlights found");
    return null;
  }

  const propertyHighlights = propertyHighlightsObject.map((highlight) => {
    return { title: highlight["title"] as string, subtitle: highlight["subtitle"] as string };
  });

  if (!propertyHighlights) {
    console.error("❌ No property highlights found");
    return null;
  }

  // extract property description from propertyDescriptionSection
  const propertyDescriptionObject = propertyDescriptionSection?.htmlDescription as Record<string, unknown> | null;
  if (!propertyDescriptionObject) {
    console.error("❌ No property description found");
    return null;
  }

  const propertyDescription = propertyDescriptionObject["htmlText"] as string | null;
  if (!propertyDescription) {
    console.error("❌ No property description found");
    return null;
  }

  const listingData = {
    id: listingId,
    url: canonicalUrl,
    property_type: propertyType,
    privacy_type: privacyType,
    title: listingTitle,
    subtitle: subtitle,
    capacityHighlights: capacityHighlights,
    propertyHighlights: propertyHighlights,
    propertyDescription: propertyDescription,
    propertyTags: propertyTags,
  };

  return listingData;
}
