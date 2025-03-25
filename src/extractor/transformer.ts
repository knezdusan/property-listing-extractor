/**
 * transformer.ts
 * Functions to transform raw API data from Airbnb into structured property data
 * that matches our schema definition.
 */

/**
 * TypeScript interfaces for the structured property data
 * These interfaces match the schema defined in schema.json
 */

// Listing interfaces
interface Listing {
  id: string;
  url: string;
  title: string;
  type: string;
  tier?: number;
  is_new: boolean;
  description: string;
  house_rules?: string[];
  safety_features?: string[];
  guest_favorite?: boolean;
  tags?: string[];
  legal_disclaimer?: string;
}

// Location interfaces
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Location {
  city: string;
  region: string;
  country: string;
  zip_code?: string;
  coordinates: Coordinates;
  neighborhood?: string;
  transportation?: string[];
  landmarks?: string[];
  noise_level?: string;
  proximity_to_airport?: string;
  walk_score?: number;
  timezone?: string;
  utc_offset?: number;
}

// Host interfaces
interface HostAvatar {
  url: string;
  accessibility_label?: string;
}

interface ResponseTime {
  value?: number;
  unit: string;
}

interface CoHost {
  id: string;
  name: string;
  rating?: number;
}

interface Host {
  id: string;
  name: string;
  is_superhost: boolean;
  verification_status?: string[];
  languages_spoken?: string[];
  contact_methods?: string[];
  years_hosting?: number;
  avatar: HostAvatar;
  bio?: string;
  response_rate?: number;
  response_time: ResponseTime;
  co_hosts?: CoHost[];
}

// Capacity interfaces
interface Bathrooms {
  full_bathrooms: number;
  half_bathrooms?: number;
}

interface Capacity {
  guests: number;
  bedrooms: number;
  room_type?: string;
  beds: number;
  bed_types?: string[];
  sleeping_arrangements?: string;
  bathrooms: Bathrooms;
  square_meters?: number;
  occupancy_limit?: number;
}

// Pricing interfaces
interface Pricing {
  base_price: number;
  currency: string;
  currency_symbol: string;
  cleaning_fee?: number;
  service_fee?: number;
  security_deposit?: number;
  total?: number;
  discount_amount?: number;
  discount_rate?: number;
  rate_type: string;
  rate_with_service_fee?: number;
  weekly_price_factor?: number;
  monthly_price_factor?: number;
  weekend_price_factor?: number;
}

// Availability interfaces
interface SeasonalMinNights {
  start_date: string;
  end_date: string;
  min_nights: number;
}

interface Availability {
  calendar_last_updated: string;
  availability_30?: number;
  availability_60?: number;
  availability_90?: number;
  availability_365?: number;
  minimum_stay_nights?: number;
  maximum_stay_nights?: number;
  checkin_window_start: string;
  checkin_window_end?: string;
  checkout_time: string;
  instant_booking_allowed?: boolean;
  booking_lead_time?: number;
  advance_notice_days?: number;
  preparation_time_days?: number;
  availability_updated_at: string;
}

// Amenities interfaces
interface AmenityCategory {
  id: string;
  name: string;
  amenities: string[];
}

interface Amenities {
  ids: number[];
  amenities_by_category?: AmenityCategory[];
  top_amenities?: string[];
  has_wifi: boolean;
  has_kitchen: boolean;
  has_air_conditioning: boolean;
  has_heating: boolean;
  has_washer: boolean;
  has_dryer: boolean;
  has_free_parking: boolean;
  has_pool: boolean;
  has_hot_tub: boolean;
  has_fire_pit: boolean;
  has_pets_allowed: boolean;
  has_smoke_alarm: boolean;
  has_carbon_monoxide_alarm: boolean;
  has_fire_extinguisher: boolean;
  has_first_aid_kit: boolean;
}

// Images interfaces
interface Image {
  id: string;
  url: string;
  caption?: string;
  type: string;
  verified: boolean;
  is_primary: boolean;
}

// Reviews interfaces
interface Review {
  id: string;
  date: string;
  reviewer_name: string;
  reviewer_image?: string;
  rating: number;
  comments: string;
}

interface Reviews {
  average_rating: number;
  total_reviews: number;
  accuracy_rating?: number;
  cleanliness_rating?: number;
  checkin_rating?: number;
  communication_rating?: number;
  location_rating?: number;
  value_rating?: number;
  review_scores_rating?: number;
  guest_satisfaction_overall?: number;
  reviews?: Review[];
  review_summary?: string;
}

// Booking availability interfaces
interface BookingAvailability {
  bookable: boolean;
  blocked_dates?: string[];
  unavailable_dates?: string[];
  available_dates?: string[];
  min_nights?: number;
  max_nights?: number;
  seasonal_min_nights?: SeasonalMinNights[];
}

// Cancellation policy interfaces
interface CancellationPolicy {
  type?: string;
  description?: string;
  cancellation_policy_id?: string;
}

// Locale details interfaces
interface LocaleDetails {
  language: string;
  currency: string;
  timezone: string;
}

// SEO interfaces
interface OgTags {
  title?: string;
  description?: string;
  image?: string;
}

interface Seo {
  meta_description?: string;
  og_tags: OgTags;
  canonical_url: string;
  structured_data?: Record<string, unknown>;
}

// Additional metadata interfaces
interface AdditionalMetadata {
  scrape_id: string;
  scrape_time: string;
  scraper_version: string;
  raw_data_blob?: string;
}

// Root property data interface
interface PropertyData {
  listing: Listing;
  location: Location;
  host: Host;
  capacity: Capacity;
  pricing: Pricing;
  availability: Availability;
  amenities: Amenities;
  images: Image[];
  reviews: Reviews;
  booking_availability: BookingAvailability;
  cancellation_policy: CancellationPolicy;
  additional_house_rules?: string;
  check_in_instructions?: string;
  accessibility_features?: string[];
  listing_expectations?: string;
  locale_details: LocaleDetails;
  seo: Seo;
  additional_metadata: AdditionalMetadata;
}

// Airbnb API data related interfaces
interface AirbnbApiData {
  [key: string]: unknown;
}

interface PdpSectionData {
  data?: {
    presentation?: {
      stayProductDetailPage?: {
        sections?: {
          sections?: Array<{
            sectionComponentType?: string;
            section?: unknown;
          }>;
        };
      };
    };
  };
}

interface Section {
  sectionComponentType?: string;
  section?: unknown;
}

interface AirbnbSection {
  [key: string]: unknown;
}

interface MediaItem {
  id?: string;
  baseUrl: string;
  imageMetadata?: {
    caption?: string;
    isVerified?: boolean;
  };
  accessibilityLabel?: string;
}

interface RatingItem {
  categoryType?: string;
  localizedRating?: number | string;
}

interface HouseRule {
  title?: string;
  subtitle?: string;
}

interface DescriptionItem {
  title?: string;
  html?: {
    htmlText?: string;
  };
}

interface ShareSaveData {
  embedData?: {
    id?: string;
    name?: string;
  };
}

interface LocationSectionData extends AirbnbSection {
  subtitle?: string;
  lat?: number | string;
  lng?: number | string;
}

interface ReviewSectionData extends AirbnbSection {
  overallRating?: number | string;
  overallCount?: number | string;
  isGuestFavorite?: boolean;
  ratings?: RatingItem[];
  heading?: {
    subtitle?: string;
  };
}

/**
 * Transforms raw Airbnb API data into structured property data
 * following the schema.json blueprint
 * @param apiData The raw API data from Airbnb endpoints
 * @returns Structured property data matching our schema or null if transformation fails
 */
export function getPropertyData(apiData: AirbnbApiData): PropertyData | null {
  try {
    // Extract data from various API endpoints
    const dataLayerVars = (apiData["/api/v2/get-data-layer-variables"] as Record<string, unknown>) || {};
    const pdpSectionsData = (apiData["/api/v3/StaysPdpSections"] as PdpSectionData) || {};
    const staysPdpSections = pdpSectionsData?.data?.presentation?.stayProductDetailPage?.sections?.sections || [];

    // These are kept for potential future use
    // const availabilityData = apiData['/api/v3/PdpAvailabilityCalendar'] as Record<string, unknown> || {};
    // const reviewsData = apiData['/api/v3/StaysPdpReviewsQuery'] as Record<string, unknown> || {};
    // const mapData = apiData['/api/v3/MapViewportInfoQuery'] as Record<string, unknown> || {};

    // Find specific sections by their sectionComponentType
    const findSection = (type: string): AirbnbSection => {
      const foundSection = (staysPdpSections as Section[]).find((section) => section?.sectionComponentType === type);
      return (foundSection?.section || {}) as AirbnbSection;
    };

    // Extract sections
    const policiesSection = findSection("POLICIES_DEFAULT");
    const photoTourSection = findSection("PHOTO_TOUR_SCROLLABLE");
    const descriptionSection = findSection("PDP_DESCRIPTION_MODAL");
    const reviewsSection = findSection("REVIEWS_DEFAULT") as ReviewSectionData;
    const locationSection = findSection("LOCATION_PDP") as LocationSectionData;
    const availabilitySection = findSection("AVAILABILITY_CALENDAR_DEFAULT");

    // We can use this in the future for pricing details
    // const bookItSection = findSection('BOOK_IT_CALENDAR_SHEET') || findSection('BOOK_IT_FLOATING_FOOTER');

    // Extract basic listing data
    const stayListingData = (dataLayerVars.stayListingData as Record<string, unknown>) || {};
    const descriptionItems = (descriptionSection.items as DescriptionItem[]) || [];

    // Extract listing ID safely
    const shareSave = (photoTourSection.shareSave || {}) as ShareSaveData;
    const embedData = shareSave.embedData || {};
    const listingId = String(embedData.id || "");

    // Helper to get description content by title
    const getDescriptionByTitle = (title: string): string => {
      const item = (descriptionItems as DescriptionItem[]).find((item) => item?.title === title);
      return item?.html?.htmlText || "";
    };

    // Helper to safely parse number from string or return default
    const safeParseNumber = (value: unknown, defaultValue: number): number => {
      if (value === null || value === undefined) return defaultValue;
      const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    // Helper to extract pricing information
    const extractPricing = (): Pricing => {
      const basePrice = safeParseNumber(stayListingData.averageDailyRateInUSD, 0);

      return {
        base_price: basePrice,
        currency: "USD", // Default to USD, could be extracted from other sources in the API
        currency_symbol: "$", // Default to USD symbol
        cleaning_fee: undefined,
        service_fee: undefined,
        security_deposit: undefined,
        total: undefined,
        discount_amount: undefined,
        discount_rate: undefined,
        rate_type: "nightly",
        rate_with_service_fee: undefined,
        weekly_price_factor: undefined,
        monthly_price_factor: undefined,
        weekend_price_factor: undefined,
      };
    };

    // Extract house rules
    const extractHouseRules = (): string[] => {
      const rules: string[] = [];

      if (Array.isArray(policiesSection.houseRulesSections)) {
        (policiesSection.houseRulesSections as Record<string, unknown>[]).forEach((section) => {
          if (Array.isArray(section.items)) {
            (section.items as HouseRule[]).forEach((item) => {
              if (item.title) {
                rules.push(item.title + (item.subtitle ? `: ${item.subtitle}` : ""));
              }
            });
          }
        });
      }

      return rules;
    };

    // Extract safety features
    const extractSafetyFeatures = (): string[] => {
      const features: string[] = [];

      if (Array.isArray(policiesSection.safetyAndPropertiesSections)) {
        (policiesSection.safetyAndPropertiesSections as Record<string, unknown>[]).forEach((section) => {
          if (Array.isArray(section.items)) {
            (section.items as HouseRule[]).forEach((item) => {
              if (item.title) {
                features.push(item.title.replace(" installed", "").trim());
              }
            });
          }
        });
      } else if (Array.isArray(policiesSection.previewSafetyAndProperties)) {
        (policiesSection.previewSafetyAndProperties as Record<string, unknown>[]).forEach((item) => {
          if ((item as HouseRule).title) {
            features.push((item as HouseRule).title as string);
          }
        });
      }

      return features;
    };

    // Extract media items
    const extractMediaItems = (): Image[] => {
      const mediaItems: Image[] = [];

      if (Array.isArray(photoTourSection.mediaItems)) {
        (photoTourSection.mediaItems as MediaItem[]).forEach((item, index) => {
          const caption = item.imageMetadata?.caption || item.accessibilityLabel || "";

          mediaItems.push({
            id: item.id || `img-${index}`,
            url: item.baseUrl,
            caption,
            type: "image",
            verified: !!item.imageMetadata?.isVerified,
            is_primary: index === 0, // First image is primary
          });
        });
      }

      return mediaItems;
    };

    // Extract check-in and checkout times
    const extractCheckInOutTimes = (): { checkIn: string; checkOut: string } => {
      let checkIn = "15:00";
      let checkOut = "11:00";

      if (Array.isArray(policiesSection.houseRules)) {
        const houseRules = policiesSection.houseRules as HouseRule[];
        const checkInRule = houseRules.find((rule) => rule.title && rule.title.includes("Check-in"));
        const checkOutRule = houseRules.find((rule) => rule.title && rule.title.includes("Checkout"));

        if (checkInRule && checkInRule.title) {
          const match = checkInRule.title.match(/after\s+(\d+:\d+\s*(?:AM|PM)?)/i);
          if (match) checkIn = match[1];
        }

        if (checkOutRule && checkOutRule.title) {
          const match = checkOutRule.title.match(/before\s+(\d+:\d+\s*(?:AM|PM)?)/i);
          if (match) checkOut = match[1];
        }
      }

      return { checkIn, checkOut };
    };

    // Extract amenities
    const extractAmenities = (): Amenities => {
      const safetyFeatures = extractSafetyFeatures();

      return {
        ids: [],
        amenities_by_category: [],
        top_amenities: [],
        has_wifi: false,
        has_kitchen: false,
        has_air_conditioning: false,
        has_heating: false,
        has_washer: false,
        has_dryer: false,
        has_free_parking: false,
        has_pool: false,
        has_hot_tub: false,
        has_fire_pit: false,
        has_pets_allowed: false,
        has_smoke_alarm: safetyFeatures.some((feature) => feature.toLowerCase().includes("smoke alarm")),
        has_carbon_monoxide_alarm: safetyFeatures.some((feature) => feature.toLowerCase().includes("carbon monoxide")),
        has_fire_extinguisher: safetyFeatures.some((feature) => feature.toLowerCase().includes("fire extinguisher")),
        has_first_aid_kit: safetyFeatures.some((feature) => feature.toLowerCase().includes("first aid")),
      };
    };

    // Extract review ratings
    const extractReviews = (): Reviews => {
      const ratings = (reviewsSection.ratings || []) as RatingItem[];

      const getFloatRating = (categoryType: string): number => {
        const rating = ratings.find((rating) => rating.categoryType === categoryType);
        return safeParseNumber(rating?.localizedRating, 0);
      };

      return {
        average_rating: safeParseNumber(reviewsSection.overallRating, 0),
        total_reviews: safeParseNumber(reviewsSection.overallCount, 0),
        accuracy_rating: getFloatRating("ACCURACY"),
        cleanliness_rating: getFloatRating("CLEANLINESS"),
        checkin_rating: getFloatRating("CHECKIN"),
        communication_rating: getFloatRating("COMMUNICATION"),
        location_rating: getFloatRating("LOCATION"),
        value_rating: getFloatRating("VALUE"),
        review_scores_rating: safeParseNumber(reviewsSection.overallRating, 0),
        guest_satisfaction_overall: safeParseNumber(reviewsSection.overallRating, 0),
        reviews: [],
        review_summary: reviewsSection.heading?.subtitle as string,
      };
    };

    // Extract capacity information
    const extractCapacity = (): Capacity => {
      let guests = 1;
      let bedrooms = 1;
      let beds = 1;
      let bathrooms = 1;

      // Try to extract from different sources
      if (Array.isArray(availabilitySection.descriptionItems)) {
        (availabilitySection.descriptionItems as HouseRule[]).forEach((item) => {
          const title = item.title || "";
          if (title.includes("bed")) {
            const match = title.match(/(\d+)\s+bed/);
            if (match) beds = parseInt(match[1], 10);
          }
          if (title.includes("bedroom")) {
            const match = title.match(/(\d+)\s+bedroom/);
            if (match) bedrooms = parseInt(match[1], 10);
          }
          if (title.includes("bath")) {
            const match = title.match(/(\d+)\s+(?:private\s+)?bath/);
            if (match) bathrooms = parseInt(match[1], 10);
          }
        });
      }

      // Try to extract max guests
      if (Array.isArray(policiesSection.houseRules)) {
        const guestRule = (policiesSection.houseRules as HouseRule[]).find(
          (rule) => rule.title && rule.title.includes("guest maximum")
        );

        if (guestRule && guestRule.title) {
          const match = guestRule.title.match(/(\d+)\s+guest maximum/);
          if (match) guests = parseInt(match[1], 10);
        }
      }

      return {
        guests: safeParseNumber(availabilitySection.maxGuestCapacity, guests),
        bedrooms,
        room_type: (stayListingData.roomType as string) || "",
        beds,
        bed_types: [],
        sleeping_arrangements: undefined,
        bathrooms: {
          full_bathrooms: bathrooms,
          half_bathrooms: 0,
        },
        square_meters: undefined,
        occupancy_limit: guests,
      };
    };

    // Extract location information
    const extractLocation = (): Location => {
      let city = "";
      let region = "";
      let country = "";

      if (typeof locationSection.subtitle === "string") {
        const parts = locationSection.subtitle.split(", ");
        if (parts.length >= 1) city = parts[0];
        if (parts.length >= 2) region = parts[1];
        if (parts.length >= 3) country = parts[2];
      }

      return {
        city: (stayListingData.city as string) || city,
        region: (stayListingData.state as string) || region,
        country: (stayListingData.country as string) || country,
        zip_code: undefined,
        coordinates: {
          latitude: safeParseNumber(locationSection.lat, 0),
          longitude: safeParseNumber(locationSection.lng, 0),
        },
        neighborhood: undefined,
        transportation: undefined,
        landmarks: undefined,
        noise_level: undefined,
        proximity_to_airport: undefined,
        walk_score: undefined,
        timezone: undefined,
        utc_offset: undefined,
      };
    };

    // Extract host information from various sections
    const extractHost = (): Host => {
      // We can use this in the future for host details
      // const embedData = (photoTourSection.shareSave as Record<string, unknown>)?.embedData || {};

      return {
        id: "",
        name: "",
        is_superhost: false,
        verification_status: [],
        languages_spoken: [],
        contact_methods: [],
        years_hosting: undefined,
        avatar: {
          url: "",
        },
        bio: undefined,
        response_rate: undefined,
        response_time: {
          value: undefined,
          unit: "hours",
        },
        co_hosts: [],
      };
    };

    // Generate a scrape ID
    const generateScrapeId = (): string => {
      // Use crypto API if available, otherwise use timestamp
      return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `scrape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Extract check-in/checkout times
    const { checkIn, checkOut } = extractCheckInOutTimes();

    // Get listing title and image safely
    const shareSaveData = (photoTourSection.shareSave as ShareSaveData) || {};
    const listingTitle = (shareSaveData.embedData?.name as string) || "";
    const firstImageUrl =
      Array.isArray(photoTourSection.mediaItems) && (photoTourSection.mediaItems as MediaItem[])[0]
        ? (photoTourSection.mediaItems as MediaItem[])[0].baseUrl
        : "";

    // Construct the final property data object
    const propertyData: PropertyData = {
      listing: {
        id: listingId,
        url: `https://www.airbnb.com/rooms/${listingId}`,
        title: listingTitle,
        type: (stayListingData.propertyType as string) || "",
        tier: undefined,
        is_new: false,
        description: getDescriptionByTitle("") || getDescriptionByTitle("The space") || "",
        house_rules: extractHouseRules(),
        safety_features: extractSafetyFeatures(),
        guest_favorite: !!reviewsSection.isGuestFavorite,
        tags: (stayListingData.categoryTags as string[]) || [],
        legal_disclaimer: undefined,
      },
      location: extractLocation(),
      host: extractHost(),
      capacity: extractCapacity(),
      pricing: extractPricing(),
      availability: {
        calendar_last_updated: new Date().toISOString(),
        availability_30: undefined,
        availability_60: undefined,
        availability_90: undefined,
        availability_365: undefined,
        minimum_stay_nights: undefined,
        maximum_stay_nights: undefined,
        checkin_window_start: checkIn,
        checkin_window_end: undefined,
        checkout_time: checkOut,
        instant_booking_allowed: undefined,
        booking_lead_time: undefined,
        advance_notice_days: undefined,
        preparation_time_days: undefined,
        availability_updated_at: new Date().toISOString(),
      },
      amenities: extractAmenities(),
      images: extractMediaItems(),
      reviews: extractReviews(),
      booking_availability: {
        bookable: true,
        blocked_dates: [],
        unavailable_dates: [],
        available_dates: [],
        min_nights: undefined,
        max_nights: undefined,
        seasonal_min_nights: [],
      },
      cancellation_policy: {
        type: undefined,
        description: undefined,
        cancellation_policy_id: undefined,
      },
      additional_house_rules: getDescriptionByTitle("Other things to note") || undefined,
      check_in_instructions: undefined,
      accessibility_features: [],
      listing_expectations: undefined,
      locale_details: {
        language: "en",
        currency: "USD",
        timezone: "America/Los_Angeles",
      },
      seo: {
        meta_description: undefined,
        og_tags: {
          title: listingTitle,
          description: getDescriptionByTitle(""),
          image: firstImageUrl,
        },
        canonical_url: `https://www.airbnb.com/rooms/${listingId}`,
      },
      additional_metadata: {
        scrape_id: generateScrapeId(),
        scrape_time: new Date().toISOString(),
        scraper_version: "1.0.0",
        raw_data_blob: undefined,
      },
    };

    return propertyData;
  } catch (error) {
    console.error("Error transforming API data:", error);
    return null;
  }
}
