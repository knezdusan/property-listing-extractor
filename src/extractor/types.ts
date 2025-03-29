// Airbnb API data related interfaces
export interface AirbnbApiData {
  [key: string]: unknown;
}

export interface Listing {
  id: string;
  url: string;
  type: string;
  privacy: string;
  title: string;
  subtitle: string;
  capacity: string[];
  highlights: { title: string; subtitle: string }[];
  description: string;
  tags: string[];
}

// Root listing data interface
export interface ListingData {
  listing: Listing;
  //   location: Location;
  //   host: Host;
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
