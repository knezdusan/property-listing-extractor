// In case AirBnb change the data structrue, update the selectors below --------------------------------------------------------------------------- :
// Main API response ApiData object properties/selectors used for extraction ---------------------------------------------------------------------- :
// Some additional properties are nested objects in these selectors and are used in the extraction functions below -------------------------------- :

// Main api endpoints ****************************************
export const EXTRACTION_API_ENDPOINTS = {
  dataLayer: "/api/v2/get-data-layer-variables",
  dataMain: "/api/v3/StaysPdpSections",
  availabilityCalendar: "/api/v3/PdpAvailabilityCalendar",
  reviews: "/api/v3/StaysPdpReviewsQuery",
};
export const EXTRACTION_API_ENDPOINTS_ARRAY = Object.values(EXTRACTION_API_ENDPOINTS);

export const LISTING_DATA_PATHS = {
  apiData: "src/extractor/data/api-data.json",
  listingData: "src/extractor/data/listing-data.json",
  refinedData: "src/extractor/data/refined-data.json",
  pagesData: "src/extractor/data/pages-data.json",
};

// Html selectors ****************************************
export const HTML_SELECTORS = {
  REVIEWS_MODAL: 'div[role="dialog"][aria-modal="true"]',
  REVIEW: "[data-review-id]",
};

// Api response selectors ****************************************
export const apiResponseSelectors = {
  // api endpoint: /api/v2/get-data-layer-variables
  DATA_LAYER: "stayListingData", // stay listing data
  // api endpoint: /api/v3/StaysPdpSections
  HOST_SECTION: "MeetYourHostSection", // host section
  SEO_FEATURES: "seoFeatures", // listing id, canonical url
  LISTING_TITLE: "listingTitle", // listing main page title
  LISTING_SUBS: "sbuiData", // subtitle, capacity highlights
  HERO_SECTION: "previewImages", // listing hero images (front page)
  HOUSE_RULES: "houseRules", // house rules (summary)
  HOUSE_RULES_SECTIONS: "houseRulesSections", // house rules section
  SAFETY: "previewSafetyAndProperties", // safety features summary
  SAFETY_SECTIONS: "safetyAndPropertiesSections", // safety & properties sections
  CATEGORY_RATINGS: "eventDataLogging", // ratings per category (accuracy, check-in, cleanliness, communication, location, value)
  AMENITIES_HIGHLIGHTS: "previewAmenitiesGroups", // amenities highlights - top amenities
  AMENITIES_ALL: "seeAllAmenitiesGroups", // amenities see all - categorized amenities
  GALLERY_TOUR: "roomTourItems", // gallery tour
  SECTIONS_ARRAY: "/api/v3/StaysPdpSections.data.presentation.stayProductDetailPage.sections.sections", // Path to sections array
  // api endpoint: /api/v3/PdpAvailabilityCalendar
  AVAILABILITY: "calendarMonths", // availability data - per month per day
  MIN_NIGHTS: "constantMinNights", // A default minimum night stay for the listing
};

// Api response nested selectors ****************************************
export const apiResponseNestedSelectors = {
  LISTING_HIGHLIGHTS: "PdpHighlightsSection",
  LISTING_DESCRIPTION: "PdpDescriptionSection",
  LISTING_LOCATION: "LocationSection",
  SLEEPING_ARRANGEMENT: "SleepingArrangementSection",
  GALLERY_PHOTOS: "PhotoTourModalSection",
  LISTING_REVIEWS: "PdpReviews",
  BOOK_IT_CALENDAR: "BookItSection", // Extracting Pets allowed from this section
  ACCESSIBILITY: "seeAllAccessibilityFeaturesGroups",
};

// Data layer API endpoint selectors ****************************************
export const dataLayerSelectors = {
  CITY: "city",
  STATE: "state",
  COUNTRY: "country",
  PRIVACY: "roomType",
  TYPE: "propertyType",
  AVG_DAILY_RATE: "averageDailyRateInUSD",
  CATEGORY_TAGS: "categoryTags",
};
