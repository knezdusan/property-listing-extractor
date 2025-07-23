// Import all types from the types file
import { getCountryName, getStateName, isValidMonthYear } from "@/utils/helpers";
import { getNestedValue, findNestedObjectByPropValue, findFirstNestedObjectNotNullOrUndefined } from "./helpers";
import { AirbnbApiData, ListingData, Availability, UnavailableRange, ListingMain, Accessibility } from "./types";

import { apiResponseNestedSelectors, apiResponseSelectors, dataLayerSelectors } from "./selectors";
import { generateAiText } from "@/utils/ai";
import { fetchAttractions } from "@/utils/google";

/**
 * Transforms raw Airbnb API data returned from getApiData into structured property listingData object
 * matching the schema.sql blueprint by:
 * - It extracts, combines, and normalizes information from multiple endpoints
 * (like host info, listing details, amenities, reviews, etc.),
 *  handling missing or nested data,
 * - and returns a single, easy-to-use object.
 * @param apiData The raw API data from Airbnb endpoints
 * @returns Structured property listingData object matching our schema.sql or null if transformation fails
 * listingData is saved and can be reviewed at data/listing-data.json
 */
export async function getListingData(apiData: AirbnbApiData): Promise<ListingData | null> {
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
  let reviewsData: Record<string, unknown>[] | null = null;
  if (!listingReviewsSection) {
    console.warn("⚠ No listing reviews section found");
  } else {
    reviewsData = listingReviewsSection["reviews"] as Record<string, unknown>[];
    if (!reviewsData) {
      console.warn("⚠ No reviews data found");
    }
  }

  // Accessiblity last Section object array
  const accessibilityFeatureGroupsArray = findFirstNestedObjectNotNullOrUndefined(
    apiData,
    apiResponseNestedSelectors.ACCESSIBILITY
  );
  if (!accessibilityFeatureGroupsArray) {
    console.log("⚠ No accessibility feature groups found - Property may not have accessibility features");
  } else {
    console.log("✔ Accessibility feature groups found");
  }

  // Extract pets allowed property using a recursive search function
  let pets = false;

  // Function to recursively search for petsAllowed boolean property in any object
  const findPetsAllowedBoolean = (obj: unknown): boolean | undefined => {
    // Base case: not an object or null
    if (!obj || typeof obj !== "object") {
      return undefined;
    }

    // If this is an array, search each item
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = findPetsAllowedBoolean(item);
        if (result !== undefined) {
          return result;
        }
      }
      return undefined;
    }

    // Check if this object has a petsAllowed boolean property
    if ("petsAllowed" in obj && typeof obj.petsAllowed === "boolean") {
      // If we find it in a BookItSection specifically, prioritize that
      if ("__typename" in obj && obj.__typename === apiResponseNestedSelectors.BOOK_IT_CALENDAR) {
        console.log("✔ Pets allowed status found in BookItSection:", obj.petsAllowed);
        return obj.petsAllowed as boolean;
      }

      // If we find a property nearby called petDetails, guestDisclaimer, etc. that references pets
      // this is likely the correct petsAllowed boolean
      if (
        "petDetails" in obj ||
        ("guestDisclaimer" in obj &&
          typeof obj.guestDisclaimer === "string" &&
          obj.guestDisclaimer.toLowerCase().includes("pet"))
      ) {
        console.log("✔ Pets allowed status found with pet context:", obj.petsAllowed);
        return obj.petsAllowed as boolean;
      }
    }

    // If this point is reached, check all properties of the object
    for (const key in obj) {
      // Safe indexing with string key using type assertion
      const value = obj[key as keyof typeof obj];
      const result = findPetsAllowedBoolean(value);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  };

  // Search for petsAllowed in the entire API data
  const petsAllowed = findPetsAllowedBoolean(apiData);
  if (petsAllowed !== undefined) {
    pets = petsAllowed;
  } else {
    console.warn("⚠ No petsAllowed boolean property found in API data");
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
  const category_ratings = extractCategoryRatingsData(categoryRatings ?? {});
  // It's okay if category_ratings is undefined - we've made it optional in the ListingData type

  // Extract reviews data ----------------------------------------------------------------------------- :
  const reviews = extractReviewsData(reviewsData ?? []);
  // It's okay if reviews is undefined - we've made it optional in the ListingData type

  // Extract accessibility data ---------------------------------------------------------------------- :
  // Ensure we're passing an array to extractAccessibilityData
  const accessibilityArray = accessibilityFeatureGroupsArray
    ? Array.isArray(accessibilityFeatureGroupsArray)
      ? accessibilityFeatureGroupsArray
      : [accessibilityFeatureGroupsArray as Record<string, unknown>]
    : null;

  // Initialize accessibility variable with undefined
  let accessibility: Accessibility[] | undefined;

  if (!accessibilityArray) {
    console.log("⚠ No accessibility data found");
  } else {
    accessibility = extractAccessibilityData(accessibilityArray);
    if (!accessibility) {
      console.log("⚠ No accessibility data found");
    }
  }

  /* ***********************************************************************************************
   ********** Fetch nearby Attractions - POIs (Points of Interest) using Google Places API ***********
   *********************************************************************************************** */
  const [latitudeStr, longitudeStr] = location.coordinates.split(",");
  const attractions_latitude = parseFloat(latitudeStr);
  const attractions_longitude = parseFloat(longitudeStr);

  const attractions = await fetchAttractions({
    latitude: attractions_latitude,
    longitude: attractions_longitude,
  });

  if (!attractions) {
    console.error("❌ Failed to fetch nearby attractions");
  }

  /* ***********************************************************************************************
   ********** AI LLM Generated Data (like logo text and page content elements text) ****************
   *********************************************************************************************** */

  // Intro Title
  const introTitle = getIntroTitle(mainListing.type, location.city, location.state, location.country);
  if (!introTitle) {
    console.error("❌ Failed to extract intro title data");
    return null;
  }

  // Intro Text
  const introText = await generateIntroText(mainListing.title, mainListing.description, mainListing.tags);
  if (!introText) {
    console.error("❌ Failed to extract intro text data");
    return null;
  }

  const listingData: ListingData = {
    host: hostData,
    listing: mainListing,
    location,
    house_rules,
    pets,
    safety_property,
    amenities,
    gallery,
    availability,
    category_ratings,
    reviews,
    attractions,
    accessibility,
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
): ListingMain | null {
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
  const sleeping = listingSleepingArrangementItems.map((arrangement) => {
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
    sleeping,
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
    console.info("⚠ No address information found");
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
  if (!categoryRatings) {
    return undefined;
  }
  const accuracy = (categoryRatings["accuracyRating"] as number) || 0;
  const check_in = (categoryRatings["checkinRating"] as number) || 0;
  const cleanliness = (categoryRatings["cleanlinessRating"] as number) || 0;
  const communication = (categoryRatings["communicationRating"] as number) || 0;
  const location = (categoryRatings["locationRating"] as number) || 0;
  const value = (categoryRatings["valueRating"] as number) || 0;
  const guest_satisfaction = (categoryRatings["guestSatisfactionOverall"] as number) || 0;

  // Allow zero values for ratings
  if (
    accuracy === undefined ||
    check_in === undefined ||
    cleanliness === undefined ||
    communication === undefined ||
    location === undefined ||
    value === undefined ||
    guest_satisfaction === undefined
  ) {
    return undefined;
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
export function extractReviewsData(reviews: Record<string, unknown>[]) {
  if (!reviews || reviews.length === 0) {
    return undefined;
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

// Extract accessibility data from accessibilityDataGroupArray
export function extractAccessibilityData(
  accessibilityDataGroupsArray: Record<string, unknown>[]
): Accessibility[] | undefined {
  if (!accessibilityDataGroupsArray || accessibilityDataGroupsArray.length === 0) {
    console.log("⚠ No accessibilityDataGroupsArray found or empty array");
    return undefined;
  }

  // Filter out any null or undefined groups first
  const validGroups = accessibilityDataGroupsArray.filter((group) => group && typeof group === "object");

  if (validGroups.length === 0) {
    console.log("⚠ No valid accessibility data groups found");
    return undefined;
  }

  // Create a properly typed array by mapping and filtering
  const accessibilityItems: Accessibility[] = [];

  for (const accessibilityDataGroup of validGroups) {
    // Check if accessibilityFeatures exists and is an array
    const accessibilityFeatures = accessibilityDataGroup["accessibilityFeatures"];
    if (!accessibilityFeatures || !Array.isArray(accessibilityFeatures) || accessibilityFeatures.length === 0) {
      console.log("⚠ Skipping group with no valid accessibilityFeatures");
      continue;
    }

    // Loop through each feature and collect accessibility data
    for (const feature of accessibilityFeatures) {
      // Extract images if available
      let images: string[] = [];
      const featureImages = feature["images"];
      if (featureImages && Array.isArray(featureImages)) {
        images = featureImages
          .filter((img) => img && typeof img === "object")
          .map((image: Record<string, unknown>) => (image["baseUrl"] as string) || "")
          .filter((url) => url !== "");
      }

      // Create a properly typed Accessibility object
      accessibilityItems.push({
        type: (accessibilityDataGroup["title"] as string) || "",
        title: (feature["title"] as string) || "",
        subtitle: (feature["subtitle"] as string) || "", // Using content instead of subtitle to match interface
        available: (feature["available"] as boolean) || false,
        images: images,
      });
    }
  }

  return accessibilityItems.length > 0 ? accessibilityItems : undefined;
}

// Extract property intro title from listing and location data (eg. "Beautiful Apartment in Praha 4, Czechia")
export function getIntroTitle(type: string, city: string, state: string, country: string) {
  const adjectives = [
    "Stunning",
    "Cozy",
    "Charming",
    "Modern",
    "Elegant",
    "Beautiful",
    "Inviting",
    "Stylish",
    "Comfortable",
    "Luxurious",
    "Welcoming",
    "Gorgeous",
    "Lovely",
    "Vibrant",
    "Delightful",
    "Sleek",
    "Chic",
    "Classy",
    "Trendy",
    "Exquisite",
    "Refined",
    "Attractive",
    "Enchanting",
    "Polished",
    "Captivating",
    "Fabulous",
    "Alluring",
    "Sophisticated",
    "Splendid",
    "Ravishing",
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

  type = type.replace(/\b\w/g, (char) => char.toUpperCase());

  if (country === "US") {
    if (!state) {
      console.error("❌ No US state found");
      return null;
    }
    const stateName = getStateName(state);
    if (!stateName) {
      console.error("❌ Failed to get US state name");
      return null;
    }
    return `${adjective} ${type} in ${city}, ${stateName}`;
  }

  const countryName = getCountryName(country);
  if (!countryName) {
    console.error("❌ Failed to get country name");
    return null;
  }
  return `${adjective} ${type} in ${city}, ${countryName}`;
}

// Generate intro text for listing using LLM function generateAiText
export async function generateIntroText(title: string, description: string, tags: string[]) {
  const prompt = `You are a creative copywriter tasked with generating a one-sentence introductory text for a property listing website's header section, based on the provided title, description, and tags. The intro text must:
- Be a single, concise sentence (15-20 words).
- Be affirmative and engaging, acting as a teaser to encourage visitors to stay on the page.
- Avoid using personal names, brand names, or specific details (e.g., locations, metro stations, or contact information) from the title or description to prevent repetition.
- Use the tags to highlight the property’s inviting nature for a short or long stay.
- Be original, focusing on the general appeal or vibe of the property (e.g., comfort, relaxation, or suitability for guests) without repeating specific details like "spacious," "private," "quiet area," or "basic necessities" from the description.

Input:
Title: ${title}
Description: ${description}
Tags: ${tags.join(", ")}

Output a single sentence that meets these criteria.`;

  const introText = await generateAiText(prompt);
  return introText;
}
