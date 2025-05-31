import { AttractionResult } from "@/extractor/types";

export async function fetchAttractions({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<AttractionResult[]> {
  const types = [
    "tourist_attraction",
    "park",
    "restaurant",
    "cafe",
    "museum",
    "historical_place",
    "shopping_mall",
    "bar",
    "cultural_landmark",
    "art_gallery",
  ];

  const maxResults = 5;
  const radius_initial = 3000;
  const radius_extended = 10000;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("❌ Google Places API key not set");
    return [];
  }

  const nearbyUrl = `https://places.googleapis.com/v1/places:searchNearby`;
  const fieldMask =
    "places.id,places.displayName,places.types,places.location,places.photos,places.editorialSummary,places.formattedAddress";

  // Initial search with smaller radius
  let places = await fetchPlacesWithRadius(radius_initial);

  // If we got fewer than 3 results, try with extended radius
  if (places.length < 3) {
    console.warn(`⚠ Found only ${places.length} places with initial radius. Trying extended radius...`);
    const extendedPlaces = await fetchPlacesWithRadius(radius_extended);

    // If we got more results with the extended radius, use those instead
    if (extendedPlaces.length > places.length) {
      console.log(`✔ Found ${extendedPlaces.length} places with extended radius.`);
      places = extendedPlaces;
    }
  }

  // Helper function to fetch places with a specific radius
  async function fetchPlacesWithRadius(radius: number) {
    const searchBody = {
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radius,
        },
      },
      includedTypes: types,
      maxResultCount: maxResults,
      languageCode: "en",
    };

    try {
      const response = await fetch(nearbyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey as string, // Cast to string to satisfy TypeScript
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(searchBody),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        let errorMsg = `Failed to fetch nearby places with radius ${radius}. Status: ${response.status}`;
        try {
          const errorBody = await response.text();
          errorMsg += `\nBody: ${errorBody}`;
        } catch {}
        console.error(`❌ ${errorMsg}`);

        // For extended radius search, return empty array instead of throwing
        if (radius === radius_extended) {
          return [];
        }
        return [];
      }

      const data = await response.json();
      return (data.places || []).slice(0, maxResults);
    } catch (error) {
      // If this is the extended radius search, just return empty array
      if (radius === radius_extended) {
        console.error(`❌ Error in extended radius search: ${error}`);
        return [];
      }
      // For initial search, rethrow the error
      return [];
    }
  }

  // Helper to get photo URLs
  interface PlacePhoto {
    name: string; // Format: places/{place_id}/photos/{photo_id}
  }
  interface PlaceLocation {
    lat: number;
    lng: number;
  }
  interface PlaceNearby {
    id: string;
    displayName?: { text: string };
    types?: string[];
    location?: PlaceLocation;
    photos?: PlacePhoto[];
    editorialSummary?: { text: string };
    formattedAddress?: string;
  }

  async function getPhotoUrls(photos: PlacePhoto[] | undefined, maxPhotos: number): Promise<string[]> {
    if (!photos || photos.length === 0) return [];
    const urls: string[] = [];

    for (let i = 0; i < Math.min(photos.length, maxPhotos); i++) {
      try {
        // The photo reference format in Places API (New) is already the full path
        // We just need to append /media and the API key
        const photoRef = photos[i].name;

        // Format should be: https://places.googleapis.com/v1/places/{place_id}/photos/{photo_id}/media
        const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=600`;
        urls.push(photoUrl);
      } catch (error) {
        console.error("❌ Error processing photo:", error);
        // Continue with next photo if one fails
      }
    }
    return urls;
  }

  // Compose attraction results
  const results: AttractionResult[] = await Promise.all(
    (places as PlaceNearby[]).map(async (place) => {
      // Get description from editorialSummary (from the new Places API)
      let description = place.editorialSummary?.text || "";

      // Fallback: fetch Place Details for a better description if needed
      if (!description || description.split(".").length < 2) {
        try {
          const detailsUrl = `https://places.googleapis.com/v1/places/${place.id}`;
          const detailsRes = await fetch(detailsUrl, {
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "editorialSummary,formattedAddress",
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          });
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData.editorialSummary?.text) {
              description = detailsData.editorialSummary.text;
            }
          }
        } catch (error) {
          console.error("❌ Error fetching place details:", error);
          // Ignore errors, fallback to address as minimal description
        }
      }
      // Ensure at least two sentences
      if (!description || description.trim() === "" || description === ".") {
        // Use the formatted address as a fallback if available
        if (place.formattedAddress) {
          description = `Located at ${place.formattedAddress}. This is a notable place in the area.`;
        } else {
          description = "No description available. This is a point of interest near the property.";
        }
      }
      return {
        id: place.id,
        name: place.displayName?.text || "Unknown",
        types: place.types || [],
        location: place.location || { lat: 0, lng: 0 },
        description,
        photos: (await getPhotoUrls(place.photos, 3)).filter((url) => !!url),
      };
    })
  );
  return results;
}
