// Import all types from the types file
import { getNestedValue, findNestedObjectByPropValue, isValidMonthYear } from "@/utils/helpers";
import { AirbnbApiData, ListingData, Availability, UnavailableRange } from "./types";

import { apiResponseNestedSelectors, apiResponseSelectors, dataLayerSelectors } from "./selectors";

/**
 * Transforms raw Airbnb API data into structured property listing data
 * following the schema.json blueprint
 * @param apiData The raw API data from Airbnb endpoints
 * @returns Structured property listing data matching our schema.json or null if transformation fails
 */
export function getListingData(apiData: AirbnbApiData): ListingData | null {
  // ApiData nested objects and selectors used for extraction -------------------------------------------- :

  // Direct selectors - return primitive value or null **********
  const listingTitle = getNestedValue(apiData, apiResponseSelectors.LISTING_TITLE) as string | null;
  if (!listingTitle) {
    console.error("❌ No listing title found");
    return null;
  }

  const minNights = getNestedValue(apiData, apiResponseSelectors.MIN_NIGHTS) as number | null;

  // Indirect selectors - return nested objects or null **********

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

  // listing hero images
  const heroImages = getNestedValue(apiData, apiResponseSelectors.HERO_SECTION) as Record<string, unknown>[] | null;
  if (!heroImages) {
    console.error("❌ No hero images found");
    return null;
  }

  // listing hero image data
  const heroImageData = heroImages[0] as Record<string, unknown> | null;
  console.log("✔ Hero image data extracted.");
  if (!heroImageData) {
    console.error("❌ No hero image data found");
    return null;
  }

  // data layer data: city, state, country, roomType, propertyType, averageDailyRateInUSD, categoryTags
  const dataLayerData = getNestedValue(apiData, apiResponseSelectors.DATA_LAYER) as Record<string, unknown> | null;
  if (!dataLayerData) {
    console.error("❌ No data layer data found");
    return null;
  }

  const houseRulesSummary = getNestedValue(apiData, apiResponseSelectors.HOUSE_RULES) as
    | Record<string, unknown>[]
    | null;
  if (!houseRulesSummary) {
    console.error("❌ No house rules summary found");
    return null;
  }

  const houseRulesSections = getNestedValue(apiData, apiResponseSelectors.HOUSE_RULES_SECTIONS) as
    | Record<string, unknown>[]
    | null;
  if (!houseRulesSections) {
    console.error("❌ No house rules sections found");
    return null;
  }

  const safetyFeaturesSummary = getNestedValue(apiData, apiResponseSelectors.SAFETY) as
    | Record<string, unknown>[]
    | null;
  if (!safetyFeaturesSummary) {
    return null;
  }

  const safetyFeaturesSections = getNestedValue(apiData, apiResponseSelectors.SAFETY_SECTIONS) as
    | Record<string, unknown>[]
    | null;
  if (!safetyFeaturesSections) {
    console.error("❌ No safety features sections found");
    return null;
  }

  const amenitiesHighlightsValue = getNestedValue(apiData, apiResponseSelectors.AMENITIES_HIGHLIGHTS) as Record<
    string,
    unknown
  > | null;
  if (!amenitiesHighlightsValue) {
    console.error("❌ No amenities highlights value found");
    return null;
  }

  const amenitiesHighlightsObject = amenitiesHighlightsValue[0] as Record<string, unknown> | null;
  if (!amenitiesHighlightsObject) {
    console.error("❌ No amenities highlights object found");
    return null;
  }

  const amenitiesHighlights = amenitiesHighlightsObject["amenities"] as Record<string, unknown>[] | null;
  if (!amenitiesHighlights) {
    console.error("❌ No amenities highlights found");
    return null;
  }

  const amenitiesAll = getNestedValue(apiData, apiResponseSelectors.AMENITIES_ALL) as Record<string, unknown>[] | null;
  if (!amenitiesAll) {
    console.error("❌ No amenities all found");
    return null;
  }

  const galleryTourSection = getNestedValue(apiData, apiResponseSelectors.GALLERY_TOUR) as
    | Record<string, unknown>[]
    | null;
  if (!galleryTourSection) {
    console.error("❌ No gallery tour section found");
    return null;
  }

  const categoryRatingsValue = getNestedValue(apiData, apiResponseSelectors.CATEGORY_RATINGS);
  // Type guard to ensure categoryRatingsValue is an object or null
  const categoryRatings =
    categoryRatingsValue !== null && typeof categoryRatingsValue === "object" && !Array.isArray(categoryRatingsValue)
      ? (categoryRatingsValue as Record<string, unknown>)
      : null;
  if (!categoryRatings) {
    console.error("❌ No category ratings found");
    return null;
  }

  const availabilityData = getNestedValue(apiData, apiResponseSelectors.AVAILABILITY) as unknown[];
  if (!availabilityData) {
    console.error("❌ No availability data found");
    return null;
  }

  // Find nested section object by __typename prope *************

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
  // This section is optional, so do not return null if not found
  if (!listingSleepingArrangementSection) {
    console.warn("⚠ No listing sleeping arrangement section found\nSome types of properties may not have this section");
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

  // Galler Photos Section object
  const galleryPhotosSection = findNestedObjectByPropValue(
    apiData,
    "section",
    "__typename",
    apiResponseNestedSelectors.GALLERY_PHOTOS
  );
  if (!galleryPhotosSection) {
    console.error("❌ No gallery photos section found");
    return null;
  }

  const galleryPhotosData = galleryPhotosSection["mediaItems"] as Record<string, unknown>[] | null;
  if (!galleryPhotosData) {
    console.error("❌ No gallery photos data found");
    return null;
  }

  // Listing reviews nested objects
  const listingReviewsSection = findNestedObjectByPropValue(
    apiData,
    "reviews",
    "__typename",
    apiResponseNestedSelectors.LISTING_REVIEWS
  );
  if (!listingReviewsSection) {
    console.error("❌ No listing reviews section found");
    return null;
  }

  const reviewsData = listingReviewsSection["reviews"] as Record<string, unknown>[] | null;
  if (!reviewsData) {
    console.error("❌ No reviews data found");
    return null;
  }

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
    heroImageData,
    listingSleepingArrangementSection || {}, // Pass empty object if missing
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
  const house_rules = extractHouseRulesData(houseRulesSummary, houseRulesSections);
  if (!house_rules) {
    console.error("❌ Failed to extract house rules data");
    return null;
  }

  // Extract safety features data -------------------------------------------------------------------- :
  const safety_property = extractSafetyFeaturesData(safetyFeaturesSummary, safetyFeaturesSections);
  if (!safety_property) {
    console.error("❌ Failed to extract safety features data");
    return null;
  }

  // Extract amenities data -------------------------------------------------------------------------- :
  const amenities = extractAmenitiesData(amenitiesHighlights, amenitiesAll);
  if (!amenities) {
    console.error("❌ Failed to extract amenities data");
    return null;
  }

  // Extract gallery photos and tour data ------------------------------------------------------------ :
  const gallery = extractGalleryPhotosData(galleryPhotosData, galleryTourSection);
  if (!gallery) {
    console.error("❌ Failed to extract gallery photos and tour data");
    return null;
  }

  // Extract availability data ----------------------------------------------------------------------- :
  const availability = extractAvailabilityData(availabilityData, minNights || 1);
  if (!availability) {
    console.error("❌ Failed to extract availability data");
    return null;
  }

  // Extract category ratings data ------------------------------------------------------------------- :
  const category_ratings = extractCategoryRatingsData(categoryRatings);
  if (!category_ratings) {
    console.error("❌ Failed to extract category ratings data");
    return null;
  }

  // Extract reviews data ---------------- :
  const reviews = extractReviewsData(reviewsData);
  if (!reviews) {
    console.error("❌ Failed to extract reviews data");
    return null;
  }

  const listingData: ListingData = {
    host: hostData,
    listing: mainListing,
    location,
    house_rules,
    safety_property,
    amenities,
    gallery,
    availability,
    category_ratings,
    reviews,
  };

  return listingData;
}

/* *******************************************************************************************
 * ******************* Helper functions ******************************************************
 ****************************************************************************************** */

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

  const cohostsData = hostSection["cohosts"] as Record<string, unknown>[] | null;
  const cohosts =
    cohostsData?.map((cohost) => ({
      id: (cohost["userId"] as string) || "",
      name: (cohost["name"] as string) || "",
      photo: (cohost["profilePictureUrl"] as string) || "",
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
    cohosts,
  };
}

// Extract listing data from API response ApiData object segments
function extractListingData(
  seoFeaturesData: Record<string, unknown>,
  dataLayerData: Record<string, unknown>,
  title: string,
  sbuiData: Record<string, unknown>,
  heroImageData: Record<string, unknown> | null,
  listingSleepingArrangementSection: Record<string, unknown>, // Accepts empty object if section is missing
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

  // extract hero images from heroImage Data
  const hero = heroImageData?.["id"] as string | null;
  if (!hero) {
    console.error("❌ No hero image found");
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
  // Do not treat empty sleeping arrangement as fatal; just set to empty array
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
    hero,
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

  if (!locationMain.city || !locationMain.country) {
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
  houseRulesSummary: Record<string, unknown>[],
  houseRulesSections: Record<string, unknown>[]
) {
  // Extract house rules summary items
  const house_rules_summary = houseRulesSummary.map((summary) => (summary["title"] as string) || "");

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

  if (!house_rules_summary || !sections) {
    return null;
  }

  return {
    house_rules_summary,
    sections,
  };
}

// Extract safety & property features data from API response ApiData object segment
export function extractSafetyFeaturesData(
  safetyFeaturesSummary: Record<string, unknown>[],
  safetyFeaturesSections: Record<string, unknown>[]
) {
  // Extract safety features summary items
  const safety_features_summary = safetyFeaturesSummary.map((summary) => (summary["title"] as string) || "");

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

  if (!safety_features_summary || !sections) {
    return null;
  }

  return {
    safety_features_summary,
    sections,
  };
}

// Extract Gallery data from API response ApiData object segment
export function extractGalleryPhotosData(
  galleryPhotosData: Record<string, unknown>[] | null,
  galleryTourSection: Record<string, unknown>[] | null
) {
  if (!galleryPhotosData || !galleryTourSection) {
    return null;
  }

  const photos = galleryPhotosData
    .filter((photo) => (photo["__typename"] as string) === "Image")
    .map((photo) => ({
      id: (photo["id"] as string) || "",
      aspectRatio: (photo["aspectRatio"] as number) || 0,
      orientation: (photo["orientation"] as string) || "",
      accessibilityLabel: (photo["accessibilityLabel"] as string) || "",
      baseUrl: (photo["baseUrl"] as string) || "",
      caption:
        ((photo["imageMetadata"] as Record<string, unknown>)?.["localizedCaption"] as string) ||
        ((photo["imageMetadata"] as Record<string, unknown>)?.["caption"] as string) ||
        "",
    }));
  const tour = galleryTourSection.map((tourItem) => ({
    title: (tourItem["title"] as string) || "",
    photos: (tourItem["imageIds"] as string[]) || [],
    highlights:
      (tourItem["highlights"] as Record<string, unknown>[]).map((highlight) => highlight["title"] as string) || [],
  }));

  return {
    photos,
    tour,
  };
}

// Extract amenities data from API response ApiData object segment
export function extractAmenitiesData(
  amenitiesHighlights: Record<string, unknown>[],
  amenitiesAll: Record<string, unknown>[]
) {
  // Extract highlights
  const highlights = amenitiesHighlights.map((highlight) => highlight["title"] as string);

  // Extract all amenities
  const allAmenitiesCategories = amenitiesAll.map((amenityGroup) => {
    return {
      category: (amenityGroup["title"] as string) || "",
      amenities: (amenityGroup["amenities"] as Record<string, unknown>[]).map((amenity) => ({
        title: (amenity["title"] as string) || "",
        subtitle: (amenity["subtitle"] as string) || "",
        top: highlights.includes(amenity["title"] as string) ? true : false,
        icon: (amenity["icon"] as string) || "",
        available: Boolean(amenity["available"]),
      })),
    };
  });

  if (!highlights || !allAmenitiesCategories) {
    return null;
  }

  return allAmenitiesCategories;
}

// Extract availability data from API response ApiData object segment
export function extractAvailabilityData(
  availabilityData: unknown[],
  minNights: number | null = 1
): Availability | null {
  const unavailableRanges: UnavailableRange[] = [];
  const defaultMinNights = minNights || 1;

  if (!availabilityData || !Array.isArray(availabilityData)) {
    console.error("❌ Availability data is not an array or is empty.");
    return null;
  }

  // 1. Flatten all valid days into a single chronological array with safety checks
  const allDays: Record<string, unknown>[] = availabilityData.reduce((acc: Record<string, unknown>[], month) => {
    // Safely access month.days
    const days = month && typeof month === "object" ? (month as Record<string, unknown>).days : undefined;
    if (Array.isArray(days)) {
      // Filter out days that don't have a valid calendarDate
      const validDays = days.filter(
        (day) => day && typeof day.calendarDate === "string" && day.calendarDate.length > 0
      );
      acc.push(...validDays);
    } else {
      console.error("❌ Month object missing or invalid 'days' array.", month);
    }
    return acc;
  }, []);

  // Ensure days are sorted by calendarDate
  allDays.sort((a, b) => {
    // Ensure calendarDate exists before comparing
    const dateA: string = (a?.calendarDate as string) ?? "";
    const dateB: string = (b?.calendarDate as string) ?? "";
    return dateA.localeCompare(dateB);
  });

  if (allDays.length === 0) {
    return { minNights: defaultMinNights, booked: [] };
  }

  let currentRangeStart: string | null = null;
  let checkoutPossibleBeforeRange = false;

  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];

    // --- Safe Property Access ---
    const calendarDate = typeof day?.calendarDate === "string" ? day.calendarDate : "";
    // Treat day as unavailable if 'available' is explicitly false, null, or undefined
    const isAvailable = day?.available === true;
    const isUnavailable = !isAvailable;

    // Need calendarDate to proceed
    if (!calendarDate) {
      console.warn("⚠ Day object missing calendarDate.", day);
      continue; // Skip this day
    }

    if (isUnavailable && currentRangeStart === null) {
      // Start of a new unavailable range
      currentRangeStart = calendarDate || "";

      // Check if checkout was possible on the day *before* this range started
      if (i > 0) {
        const prevDay = allDays[i - 1];
        // Default to false if property missing/null
        checkoutPossibleBeforeRange = prevDay?.availableForCheckout === true;
      } else {
        checkoutPossibleBeforeRange = false; // No previous day
      }
    } else if (!isUnavailable && currentRangeStart !== null) {
      // End of the current unavailable range (because current day is available)
      const prevDay = allDays[i - 1];
      const rangeEnd = prevDay?.calendarDate ?? ""; // The last unavailable day

      if (!rangeEnd) {
        console.warn("⚠ Could not determine range end date for start:", currentRangeStart);
        // Reset and continue, as the previous day was invalid
        currentRangeStart = null;
        checkoutPossibleBeforeRange = false;
        continue;
      }

      // Check if checkin is possible on the day *after* the range ended (which is the current 'day')
      // Default to false if property missing/null
      const checkinPossibleAfterRange = day?.availableForCheckin === true;

      unavailableRanges.push({
        start: currentRangeStart as string,
        end: rangeEnd as string,
        checkout: Boolean(checkoutPossibleBeforeRange),
        checkin: Boolean(checkinPossibleAfterRange),
      });
      // Reset for the next potential range
      currentRangeStart = null;
      checkoutPossibleBeforeRange = false;
    }
  }

  // Handle case where the data ends with an unavailable range
  if (currentRangeStart !== null) {
    const lastDay = allDays[allDays.length - 1];
    const rangeEnd = lastDay?.calendarDate ?? "";

    if (rangeEnd) {
      // Cannot check in after the last day in the data
      const checkinPossibleAfterRange = false;

      unavailableRanges.push({
        start: currentRangeStart as string,
        end: rangeEnd as string,
        checkout: Boolean(checkoutPossibleBeforeRange),
        checkin: Boolean(checkinPossibleAfterRange),
      });
    } else {
      console.warn("⚠ Could not determine final range end date for start:", currentRangeStart);
    }
  }

  return { minNights: defaultMinNights, booked: unavailableRanges };
}

// Extract category ratings data from API response ApiData object segment
export function extractCategoryRatingsData(categoryRatings: Record<string, unknown>) {
  const accuracy = (categoryRatings["accuracyRating"] as number) || 0;
  const check_in = (categoryRatings["checkinRating"] as number) || 0;
  const cleanliness = (categoryRatings["cleanlinessRating"] as number) || 0;
  const communication = (categoryRatings["communicationRating"] as number) || 0;
  const location = (categoryRatings["locationRating"] as number) || 0;
  const value = (categoryRatings["valueRating"] as number) || 0;
  const guest_satisfaction = (categoryRatings["guestSatisfactionOverall"] as number) || 0;

  if (!accuracy || !check_in || !cleanliness || !communication || !location || !value || !guest_satisfaction) {
    return null;
  }

  return {
    accuracy,
    check_in,
    cleanliness,
    communication,
    location,
    value,
    guest_satisfaction,
  };
}

// Extract reviews data from API response ApiData object segment
function extractReviewsData(reviews: Record<string, unknown>[]) {
  if (!reviews) {
    return null;
  }

  const reviewsData = reviews.map((review) => {
    // Extract comments according to language
    let comments = "";
    const language = (review["language"] as string) || "";

    if (language === "en") {
      comments = (review["comments"] as string) || "";
    } else {
      comments = ((review["localizedReview"] as Record<string, unknown>)?.["comments"] as string) || "";
    }

    // Extract response according to language
    let response = "";
    if (language === "en") {
      response = (review["response"] as string) || "";
    } else {
      response = ((review["localizedReview"] as Record<string, unknown>)?.["response"] as string) || "";
    }

    // Extract reviewer data
    const reviewerData = (review["reviewer"] as Record<string, unknown>) || {};
    const reviewerId = (reviewerData["id"] as string) || "";
    const reviewerName = (reviewerData["firstName"] as string) || "";
    const photo = (reviewerData["pictureUrl"] as string) || "";
    const reviewer = {
      id: reviewerId,
      name: reviewerName,
      photo,
    };

    // Extract visit period
    let period = (review["localizedDate"] as string) || "";
    // if period is empty or if it is not this date format (e.g., June 2023), set it this month, this year
    if (!period || !isValidMonthYear(period)) {
      period = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    return {
      id: (review["id"] as string) || "",
      language,
      comments,
      rating: (review["rating"] as number) || 0,
      highlight: (review["reviewHighlight"] as string) || "",
      period,
      reviewer,
      response,
      createdAt: (review["createdAt"] as string) || "",
    };
  });

  return reviewsData;
}
