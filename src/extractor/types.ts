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
  description: string;
  highlights: { title: string; subtitle: string }[];
  hero: string;
  average_daily_rate: number;
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
  house_rules_summary: string[];
  sections: RulesSection[];
}

// Safety & property features interfaces -------------------------------------
export interface SafetyProperty {
  safety_features_summary: string[];
  sections: RulesSection[];
}

// Gallery interfaces -------------------------------------
export interface GalleryPhoto {
  id: string;
  baseUrl: string;
  aspectRatio?: number;
  orientation?: string;
  accessibilityLabel?: string;
  caption?: string;
}

export interface GalleryTourItem {
  title: string;
  photos: string[];
  highlights: string[];
}

export interface Gallery {
  photos: GalleryPhoto[];
  tour: GalleryTourItem[];
}

// Amenities interfaces -------------------------------------

interface AmenityItem {
  title: string;
  subtitle: string;
  top: boolean;
  icon: string;
  available: boolean;
}

interface AmenityCategory {
  category: string;
  amenities: AmenityItem[];
}

// Availability interface -------------------------------------
export interface Availability {
  minNights: number;
  booked: UnavailableRange[];
}

export interface UnavailableRange {
  start: string;
  end: string;
  checkout: boolean;
  checkin: boolean;
}

// Category ratings interface -------------------------------------
export interface CategoryRatings {
  accuracy: number;
  check_in: number;
  cleanliness: number;
  communication: number;
  location: number;
  value: number;
  guest_satisfaction: number;
}

// Reviews interface -------------------------------------
export interface Reviewer {
  id: string;
  name: string;
  photo: string;
}

export interface Review {
  id: string;
  language: string;
  comments: string;
  rating: number;
  highlight?: string;
  period?: string;
  reviewer: Reviewer;
  response?: string;
  createdAt: string;
}

export type Reviews = Review[];

interface Extra {
  main_title: string;
  intro_text: string;
}

/* ********************************************************************
 * ******* Root listing data interface ********************************
 ******************************************************************* */
export interface ListingData {
  host: Host;
  listing: ListingMain;
  location: Location;
  house_rules: HouseRules;
  pets: boolean;
  safety_property: SafetyProperty;
  amenities: AmenityCategory[];
  gallery: Gallery;
  availability: Availability;
  category_ratings: CategoryRatings;
  reviews: Reviews;
  extra: Extra;
}
