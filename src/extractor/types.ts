// Airbnb API data related interfaces
export interface AirbnbApiData {
  [key: string]: unknown;
}

// Host interfaces -------------------------------------
interface CoHost {
  id: string;
  name: string;
  rating?: number;
}

interface OtherListing {
  id: string;
  name: string;
  url: string;
}

export interface Host {
  id: string;
  name: string;
  superhost: boolean;
  photo: string;
  reviews: number;
  rating: number;
  years_hosting?: number;
  about: string;
  highlights?: string[];
  details?: string[];
  contact_methods?: string[];
  business_details?: string;
  co_hosts?: CoHost[];
  other_listings?: OtherListing[];
}

// Listing main interface -------------------------------------

interface SleepingArrangement {
  title: string;
  subtitle: string;
  images?: string[];
}

export interface ListingMain {
  id: string;
  url: string;
  type: string;
  privacy: string;
  title: string;
  subtitle: string;
  capacity: string[];
  sleeping_arrangement?: SleepingArrangement[];
  highlights: { title: string; subtitle: string }[];
  description: string;
  tags: string[];
}

// Location interfaces -------------------------------------
interface LocationDetail {
  title: string;
  content: string;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  address?: string;
  zip?: string;
  coordinates: string;
  details?: LocationDetail[];
  disclaimer?: string | null;
}

// House rules interfaces -------------------------------------

interface RuleItem {
  title: string;
  subtitle: string;
  html: string | null;
}

interface RulesSection {
  section: string;
  rules: RuleItem[];
}

export interface HouseRules {
  intro: string[];
  sections: RulesSection[];
}

// Safety & property features interfaces -------------------------------------

export interface SafetyProperty {
  intro: string[];
  sections: RulesSection[];
}

/* ********************************************************************
 * ******* Root listing data interface ********************************
 ******************************************************************* */
export interface ListingData {
  host: Host;
  listing: ListingMain;
  location: Location;
  house_rules: HouseRules;
  safety_property: SafetyProperty;
  //   capacity: Capacity;
  //   pricing: Pricing;
  //   availability: Availability;
  //   amenities: Amenities;
  //   images: Image[];
  //   reviews: Reviews;
  //   booking_availability: BookingAvailability;
  //   cancellation_policy: CancellationPolicy;
  //   check_in_instructions?: string;
  //   accessibility_features?: string[];
  //   listing_expectations?: string;
  //   locale_details: LocaleDetails;
  //   seo: Seo;
  //   additional_rules?: string;
}
