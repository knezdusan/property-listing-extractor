export const dynamic = "force-dynamic";

// Testing the getBrandingIdentity helper function

import listingData from "@/extractor/data/listing-data.json";
import { getBrandingIdentity } from "@/extractor/helpers";
import { BrandingIdentity, ListingBrand } from "@/extractor/types";

// Create a ListingBrand object from the listing data
const listingBrand: ListingBrand = {
  title: listingData.listing.title,
  subtitle: listingData.listing.subtitle,
  description: listingData.listing.description,
  tags: listingData.listing.tags.join(", "),
};

// Generate branding identity using AI
let brandingIdentity: BrandingIdentity | null = null;
let errorMessage: string | null = null;

// Process the result
try {
  brandingIdentity = await getBrandingIdentity(listingBrand);
  console.log("✔ Successfully generated branding identity:", brandingIdentity);
} catch (e) {
  errorMessage = e instanceof Error ? e.message : "Unknown error";
  console.error("❌ Failed to generate branding identity:", errorMessage);
}

export default function AiTestPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Test - Branding Identity Generation</h1>

      {errorMessage ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{errorMessage}</p>
        </div>
      ) : brandingIdentity ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-green-800 mb-2">Branding Identity</h2>
            <ul className="text-sm space-y-2">
              <li>
                <span className="font-medium">Evocative Name:</span> {brandingIdentity.brandName}
              </li>
              <li>
                <span className="font-medium">Tagline:</span> {brandingIdentity.tagline}
              </li>
              <li>
                <span className="font-medium">Personality Vibe:</span> {brandingIdentity.brandVibe}
              </li>
              <li>
                <span className="font-medium">Keywords:</span> {brandingIdentity.keywords.join(", ")}
              </li>
            </ul>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-4">Original Listing Data</h2>
            <ul className="text-sm space-y-2">
              <li>
                <span className="font-medium">Title:</span> {listingBrand.title}
              </li>
              <li>
                <span className="font-medium">Subtitle:</span> {listingBrand.subtitle}
              </li>
              <li>
                <span className="font-medium">Tags:</span> {listingBrand.tags}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700">No branding identity was generated.</p>
        </div>
      )}
    </div>
  );
}
