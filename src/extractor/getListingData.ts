// Import all types from the types file
import { getNestedValue, findNestedObjectByPropValue } from "@/utils/helpers";
import { AirbnbApiData, ListingData } from "./types";

import { apiResponseNestedSelectors, apiResponseSelectors, dataLayerSelectors } from "./selectors";

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

  const houseRulesIntro = getNestedValue(apiData, apiResponseSelectors.HOUSE_RULES) as Record<string, unknown>[] | null;
  if (!houseRulesIntro) {
    console.error("❌ No house rules intro found");
    return null;
  }

  const houseRulesSections = getNestedValue(apiData, apiResponseSelectors.HOUSE_RULES_SECTIONS) as
    | Record<string, unknown>[]
    | null;
  if (!houseRulesSections) {
    console.error("❌ No house rules sections found");
    return null;
  }

  const safetyFeaturesIntro = getNestedValue(apiData, apiResponseSelectors.SAFETY) as Record<string, unknown>[] | null;
  if (!safetyFeaturesIntro) {
    console.error("❌ No safety features intro found");
    return null;
  }

  const safetyFeaturesSections = getNestedValue(apiData, apiResponseSelectors.SAFETY_SECTIONS) as
    | Record<string, unknown>[]
    | null;
  if (!safetyFeaturesSections) {
    console.error("❌ No safety features sections found");
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

  // data layer data: city, state, country, roomType, propertyType, averageDailyRateInUSD, categoryTags
  const dataLayerData = getNestedValue(apiData, apiResponseSelectors.DATA_LAYER) as Record<string, unknown> | null;
  if (!dataLayerData) {
    console.error("❌ No data layer data found");
    return null;
  }

  // Find nested section object by __typename prope*************

  // Host Section object
  const hostSection = findNestedObjectByPropValue(apiData, "section", "__typename", apiResponseSelectors.HOST_SECTION);
  if (!hostSection) {
    console.error("❌ No host section found");
    return null;
  }

  // Listing Highlights Section object
  const listingHighlightsSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    apiResponseNestedSelectors.LISTING_HIGHLIGHTS
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
    apiResponseNestedSelectors.LISTING_DESCRIPTION
  );
  if (!listingDescriptionSection) {
    console.error("❌ No listing description section found");
    return null;
  }

  // Listing Sleeping Arrangement Section object
  const listingSleepingArrangementSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    apiResponseNestedSelectors.SLEEPING_ARRANGEMENT
  );
  if (!listingSleepingArrangementSection) {
    console.error("❌ No listing sleeping arrangement section found");
    return null;
  }

  // Listing Location Section object
  const listingLocationSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    apiResponseNestedSelectors.LISTING_LOCATION
  );
  if (!listingLocationSection) {
    console.error("❌ No listing location section found");
    return null;
  }

  const locationData = { ...dataLayerData, location_details: { ...listingLocationSection } };

  /* ********************************************************************************************
   *************************************** Extract API Sections Data *****************************
   ******************************************************************************************** */

  // Extract host section data ----------------------------------------------------------------------- :
  const hostData = extractHostData(hostSection);
  if (!hostData) {
    console.error("❌ Failed to extract host data");
    return null;
  }

  // Extract listing section data  ------------------------------------------------------------------- :

  // Extract main listing data
  const mainListing = extractListingData(
    seoFeaturesData,
    dataLayerData,
    listingTitle,
    sbuiData,
    listingSleepingArrangementSection,
    listingHighlightsSection,
    listingDescriptionSection
  );
  if (!mainListing) {
    console.error("❌ Failed to extract listing data");
    return null;
  }

  // Extract location data
  const location = extractLocationData(locationData);
  if (!location) {
    console.error("❌ Failed to extract location data");
    return null;
  }

  // Extract house rules data ------------------------------------------------------------------------ :
  const house_rules = extractHouseRulesData(houseRulesIntro, houseRulesSections);
  if (!house_rules) {
    console.error("❌ Failed to extract house rules data");
    return null;
  }

  // Extract safety features data -------------------------------------------------------------------- :
  const safety_property = extractSafetyFeaturesData(safetyFeaturesIntro, safetyFeaturesSections);
  if (!safety_property) {
    console.error("❌ Failed to extract safety features data");
    return null;
  }

  const listingData: ListingData = {
    host: hostData,
    listing: mainListing,
    location,
    house_rules,
    safety_property,
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

/* *************************************************************************************************************
 * ******************* Helper functions ************************************************************************
 ************************************************************************************************************ */

// Extract host data from API response ApiData object segment
function extractHostData(hostSection: Record<string, unknown>) {
  if (!hostSection) {
    console.error("❌ No host section found");
    return null;
  }

  const mainData = hostSection["cardData"] as Record<string, unknown> | null;
  if (!mainData) {
    console.error("❌ No main data found");
    return null;
  }

  const id = (mainData["userId"] as string) || "";
  const name = (mainData["name"] as string) || "";
  const superhost = Boolean(mainData["isSuperhost"]);
  const photo = (mainData["profilePictureUrl"] as string) || "";
  const reviews = Number(mainData["ratingCount"]) || 0;
  const rating = Number(mainData["ratingAverage"]) || 0;

  if (!id || !name) {
    console.error("❌ Failed to extract host data");
    return null;
  }

  const yearsHostingData = mainData["timeAsHost"] as Record<string, unknown> | null;
  const years_hosting = (yearsHostingData?.["years"] as number) || undefined;

  const about = (hostSection["about"] as string) || "";

  const highlightsData = hostSection["hostHighlights"] as Record<string, unknown>[] | null;
  const highlights = highlightsData?.map((item) => item["title"] as string) || [];

  const detailsData = hostSection["hostDetails"] as string[] | null;
  const details = detailsData?.map((item) => item) || [];

  const coHostsData = hostSection["coHosts"] as Record<string, unknown>[] | null;
  const co_hosts =
    coHostsData?.map((coHost) => ({
      id: (coHost["id"] as string) || "",
      name: (coHost["name"] as string) || "",
      rating: (coHost["rating"] as number) || undefined,
    })) || [];

  return {
    id,
    name,
    superhost,
    photo,
    reviews,
    rating,
    years_hosting,
    about,
    highlights,
    details,
    co_hosts,
  };
}

// Extract listing data from API response ApiData object segments
function extractListingData(
  seoFeaturesData: Record<string, unknown>,
  dataLayerData: Record<string, unknown>,
  title: string,
  sbuiData: Record<string, unknown>,
  listingSleepingArrangementSection: Record<string, unknown>,
  listingHighlightsSection: Record<string, unknown>,
  listingDescriptionSection: Record<string, unknown>
) {
  // extract listing canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973)
  const url = (seoFeaturesData["canonicalUrl"] as string) || "";
  if (!url) {
    console.error("❌ No canonicalUrl found");
    return null;
  }

  // extract listing id from canonicalUrl (e.g. https://www.airbnb.com/rooms/30397973 -> 30397973)
  const id = url.split("/").pop() || "";
  if (!id) {
    console.error("❌ No listingId found");
    return null;
  }

  // Extract listing type and privacy from dataLayerData
  const type = (dataLayerData[dataLayerSelectors.TYPE] as string) || "";
  if (!type) {
    console.error("❌ No listingType found");
    return null;
  }

  const privacy = (dataLayerData[dataLayerSelectors.PRIVACY] as string) || "";
  if (!privacy) {
    console.error("❌ No privacy found");
    return null;
  }

  // extract listing subtitle from sbuiData
  const subtitle = (getNestedValue(sbuiData, "title") as string) || "";
  if (!subtitle) {
    console.error("❌ No subtitle property selector 'title' found");
    return null;
  }

  // extract capacity highlights from sbuiData
  const capacityHighlightsItems = (getNestedValue(sbuiData, "overviewItems") as Record<string, unknown>[]) || [];
  if (!capacityHighlightsItems || capacityHighlightsItems.length === 0) {
    console.error("❌ No capacity highlights property selector 'overviewItems' found");
    return null;
  }

  // extract capacity highlights from capacityHighlightsItems
  const capacity = capacityHighlightsItems.map((item) => (item["title"] as string) || "");
  if (!capacity || capacity.length === 0) {
    console.error("❌ No capacity highlights found");
    return null;
  }

  // extract listing sleeping arrangement from listingSleepingArrangementSection
  const listingSleepingArrangementItems =
    (listingSleepingArrangementSection?.arrangementDetails as Record<string, unknown>[]) || [];
  if (!listingSleepingArrangementItems || listingSleepingArrangementItems.length === 0) {
    console.error("❌ No listing sleeping arrangement found");
    return null;
  }

  const sleeping_arrangement = listingSleepingArrangementItems.map((arrangement) => {
    const images = (arrangement["images"] as Record<string, unknown>[]) || [];
    return {
      title: (arrangement["title"] as string) || "",
      subtitle: (arrangement["subtitle"] as string) || "",
      images: Array.isArray(images) ? images.map((image) => (image["id"] as string) || "") : [],
    };
  });

  // extract listing highlights from listingHighlightsSection
  const listingHighlightsItems = (listingHighlightsSection?.highlights as Record<string, unknown>[]) || [];
  if (!listingHighlightsItems || listingHighlightsItems.length === 0) {
    console.error("❌ No listing highlights found");
    return null;
  }

  const highlights = listingHighlightsItems.map((highlight) => {
    return {
      title: (highlight["title"] as string) || "",
      subtitle: (highlight["subtitle"] as string) || "",
    };
  });

  if (!highlights || highlights.length === 0) {
    console.error("❌ No listing highlights found");
    return null;
  }

  // extract listing description from listingDescriptionSection -------------------------------------------------
  const descriptionObject = (listingDescriptionSection?.htmlDescription as Record<string, unknown>) || {};
  if (!descriptionObject) {
    console.error("❌ No listing description found");
    return null;
  }

  const description = (descriptionObject["htmlText"] as string) || "";
  if (!description) {
    console.error("❌ No property description found");
    return null;
  }

  // extract average daily rate from dataLayerData
  const average_daily_rate = (dataLayerData[dataLayerSelectors.AVG_DAILY_RATE] as number) || 0;
  if (!average_daily_rate) {
    console.warn("⚠ No average daily rate found");
  }

  // Extract listing Tags from dataLayerData
  const tags = (dataLayerData[dataLayerSelectors.CATEGORY_TAGS] as string[]) || [];
  if (!tags || tags.length === 0) {
    console.warn("⚠ No listing tags found");
  }

  if (!id || !url || !type || !privacy || !title || !capacity || !description) {
    console.error("❌ Failed to extract listing data");
    return null;
  }

  return {
    id,
    url,
    type,
    privacy,
    title,
    subtitle,
    capacity,
    sleeping_arrangement,
    highlights,
    description,
    average_daily_rate,
    tags,
  };
}

// Extract location data from API response ApiData object segments -------------------------------------------------
function extractLocationData(locationData: Record<string, unknown>) {
  const locationMain = {
    city: (locationData["city"] as string) || "",
    state: (locationData["state"] as string) || "",
    country: (locationData["country"] as string) || "",
  };

  if (!locationMain.city || !locationMain.state || !locationMain.country) {
    console.error("❌ No location data found");
    return null;
  }

  const locationDetailsObject = locationData["location_details"] as Record<string, unknown> | null;
  if (!locationDetailsObject) {
    console.error("❌ No location details found");
    return null;
  }

  const addressData = {
    address: (locationDetailsObject["address"] as string) || undefined,
    addressTitle: (locationDetailsObject["addressTitle"] as string) || undefined,
  };
  if (!addressData.address || !addressData.addressTitle) {
    console.warn("⚠ No address information found");
  }

  // Extract coordinates
  const lat = locationDetailsObject["lat"] as number | null;
  const lng = locationDetailsObject["lng"] as number | null;

  if (!lat || !lng) {
    console.error("❌ No coordinates found");
    return null;
  }

  const coordinates = `${lat},${lng}`;

  const details: { title: string; content: string }[] = [];

  const locationDetailsSection = locationDetailsObject["seeAllLocationDetails"] as Record<string, unknown>[] | null;
  if (!locationDetailsSection) {
    console.warn("⚠ No location details found");
  } else {
    locationDetailsSection.forEach((locationDetailData) => {
      const title = (locationDetailData["title"] as string) || "";
      const contentObj = locationDetailData["content"] as Record<string, unknown> | null;
      const content = contentObj && typeof contentObj === "object" ? (contentObj["htmlText"] as string) || "" : "";

      if (title && content) {
        details.push({ title, content });
      }
    });
  }

  const disclaimer = (locationDetailsObject["locationDisclaimer"] as string) || null;

  return {
    ...locationMain,
    ...addressData,
    coordinates,
    details: details.length > 0 ? details : [],
    disclaimer,
  };
}

// Extract house rules data from API response ApiData object segment
export function extractHouseRulesData(
  houseRulesIntro: Record<string, unknown>[],
  houseRulesSections: Record<string, unknown>[]
) {
  // Extract intro items
  const intro = houseRulesIntro.map((intro) => (intro["title"] as string) || "");

  // Extract sections with rules
  const sections = houseRulesSections.map((section) => {
    const rules = (section["items"] as Record<string, unknown>[]) || [];
    return {
      section: (section["title"] as string) || "",
      rules: rules.map((rule) => ({
        title: (rule["title"] as string) || "",
        subtitle: (rule["subtitle"] as string) || "",
        html: ((rule["html"] as Record<string, unknown>)?.["htmlText"] as string) || null,
      })),
    };
  });

  return {
    intro,
    sections,
  };
}

// Extract safety & property features data from API response ApiData object segment
export function extractSafetyFeaturesData(
  safetyFeaturesIntro: Record<string, unknown>[],
  safetyFeaturesSections: Record<string, unknown>[]
) {
  // Extract intro items
  const intro = safetyFeaturesIntro.map((intro) => (intro["title"] as string) || "");

  // Extract sections with rules
  const sections = safetyFeaturesSections.map((section) => {
    const rules = (section["items"] as Record<string, unknown>[]) || [];
    return {
      section: (section["title"] as string) || "",
      rules: rules.map((rule) => ({
        title: (rule["title"] as string) || "",
        subtitle: (rule["subtitle"] as string) || "",
        html: ((rule["html"] as Record<string, unknown>)?.["htmlText"] as string) || null,
      })),
    };
  });

  return {
    intro,
    sections,
  };
}
