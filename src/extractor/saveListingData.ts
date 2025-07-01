import { supabaseServer } from "@/utils/supabase";
import { ListingData } from "./types";
import { isValidUUID } from "@/utils/helpers";

/**
 * Persists a complete ListingData object into Supabase tables according to schema.sql.
 * Deletes existing related rows for this listing to prevent duplicates, then inserts fresh data.
 */
export default async function saveListingData(listingData: ListingData): Promise<boolean> {
  const {
    host,
    listing,
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
    extra,
  } = listingData;
  // Track which tables were written to for compensation
  const completed: { [key: string]: boolean } = {};
  try {
    // *** Upsert host
    const { error: hostError } = await supabaseServer.from("hosts").upsert(
      {
        id: host.id,
        user_id: listing.id,
        name: host.name,
        superhost: host.superhost,
        photo: host.photo,
        review_count: host.reviews,
        rating: host.rating,
        years_hosting: host.years_hosting ?? null,
        about: host.about,
        highlights: host.highlights ?? [],
        details: host.details ?? [],
      },
      { onConflict: "id" }
    );
    if (hostError) throw new Error(`Error upserting host: ${hostError.message}`);
    completed.host = true;

    // *** Upsert site
    const { data: siteData, error: siteError } = await supabaseServer
      .from("sites")
      .upsert(
        {
          host_id: host.id,
          cohosts: host.cohosts ?? [],
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    if (siteError) throw new Error(`Error upserting site: ${siteError.message}`);
    completed.site = true;
    if (!siteData?.id || !isValidUUID(siteData.id)) {
      throw new Error("siteData.id is missing or invalid");
    }
    const siteId = siteData.id;

    // *** Upsert listing
    const [lat, lng] = location.coordinates.split(",").map((c) => parseFloat(c.trim()));
    const { error: listingError } = await supabaseServer.from("listings").upsert(
      {
        id: listing.id,
        site_id: siteId,
        url: listing.url,
        type: listing.type,
        privacy: listing.privacy,
        title: listing.title,
        subtitle: listing.subtitle,
        description: listing.description,
        highlights: listing.highlights ?? [],
        hero: listing.hero,
        intro_title: extra.intro_title,
        intro_text: extra.intro_text,
        average_daily_rate: listing.average_daily_rate,
        min_nights: availability.minNights,
        capacity_summary: listing.capacity,
        house_rules_summary: house_rules.house_rules_summary,
        sleeping: listing.sleeping,
        safety_features_summary: safety_property.safety_features_summary,
        pets: pets,
        tags: listing.tags,
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: lat,
        longitude: lng,
        location_disclaimer: location.disclaimer ?? null,
        ratings: category_ratings,
      },
      { onConflict: "id" }
    );
    if (listingError) throw new Error(`Error upserting listing: ${listingError.message}`);
    completed.listing = true;

    // *** Location details
    await supabaseServer.from("location_details").delete().eq("listing_id", listing.id);
    if (location.details?.length) {
      const locRows = location.details.map((d) => ({
        listing_id: listing.id,
        title: d.title,
        content: d.content,
      }));
      const { error } = await supabaseServer.from("location_details").insert(locRows);
      if (error) throw new Error(`Error inserting location details: ${error.message}`);
      completed.location_details = true;
    }

    // *** Amenities
    await supabaseServer.from("amenities").delete().eq("listing_id", listing.id);
    if (amenities.length) {
      const amRows = amenities.flatMap((cat) =>
        cat.amenities.map((a) => ({
          listing_id: listing.id,
          category: cat.category,
          title: a.title,
          subtitle: a.subtitle,
          top: a.top,
          icon: a.icon,
          available: a.available,
        }))
      );
      const { error } = await supabaseServer.from("amenities").insert(amRows);
      if (error) throw new Error(`Error inserting amenities: ${error.message}`);
      completed.amenities = true;
    }

    // *** Photos
    await supabaseServer.from("photos").delete().eq("listing_id", listing.id);
    if (gallery.photos?.length) {
      const photoRows = gallery.photos.map((p) => ({
        id: p.id,
        listing_id: listing.id,
        url: p.baseUrl,
        aspect_ratio: p.aspectRatio ?? null,
        orientation: p.orientation ?? null,
        accessibility_label: p.accessibilityLabel ?? null,
        caption: p.caption ?? null,
      }));
      const { error } = await supabaseServer.from("photos").insert(photoRows);
      if (error) throw new Error(`Error inserting photos: ${error.message}`);
      completed.photos = true;
    }

    // *** Tour
    await supabaseServer.from("tour").delete().eq("listing_id", listing.id);
    if (gallery.tour?.length) {
      const tourRows = gallery.tour.map((t, idx) => ({
        listing_id: listing.id,
        title: t.title,
        photos: t.photos,
        highlights: t.highlights,
        position: idx,
      }));
      const { error } = await supabaseServer.from("tour").insert(tourRows);
      if (error) throw new Error(`Error inserting tour: ${error.message}`);
      completed.tour = true;
    }

    // *** Availability
    await supabaseServer.from("availability").delete().eq("listing_id", listing.id);
    if (availability.booked?.length) {
      const avRows = availability.booked.map((b) => ({
        listing_id: listing.id,
        start_date: b.start,
        end_date: b.end,
        checkin: b.checkin,
        checkout: b.checkout,
      }));
      const { error } = await supabaseServer.from("availability").insert(avRows);
      if (error) throw new Error(`Error inserting availability: ${error.message}`);
      completed.availability = true;
    }

    // *** House rules
    await supabaseServer.from("house_rules").delete().eq("listing_id", listing.id);
    if (house_rules.sections?.length) {
      const hrRows = house_rules.sections.flatMap((sec) =>
        sec.rules.map((r) => ({
          listing_id: listing.id,
          section: sec.section,
          title: r.title,
          subtitle: r.subtitle,
          html: r.html,
        }))
      );
      const { error } = await supabaseServer.from("house_rules").insert(hrRows);
      if (error) throw new Error(`Error inserting house rules: ${error.message}`);
      completed.house_rules = true;
    }

    // *** Safety & property features
    await supabaseServer.from("safety_property").delete().eq("listing_id", listing.id);
    if (safety_property.sections?.length) {
      const spRows = safety_property.sections.flatMap((sec) =>
        sec.rules.map((r) => ({
          listing_id: listing.id,
          section: sec.section,
          title: r.title,
          subtitle: r.subtitle,
          html: r.html,
        }))
      );
      const { error } = await supabaseServer.from("safety_property").insert(spRows);
      if (error) throw new Error(`Error inserting safety_property: ${error.message}`);
      completed.safety_property = true;
    }

    // *** Reviews
    await supabaseServer.from("reviews").delete().eq("listing_id", listing.id);
    if (reviews?.length) {
      const rvRows = reviews.map((r) => ({
        id: r.id,
        listing_id: listing.id,
        reviewer_id: r.reviewer.id,
        name: r.reviewer.name,
        photo: r.reviewer.photo,
        language: r.language,
        comments: r.comments,
        rating: r.rating,
        highlight: r.highlight ?? null,
        period: r.period ?? null,
        response: r.response ?? null,
        created_at: r.createdAt,
      }));
      const { error } = await supabaseServer.from("reviews").insert(rvRows);
      if (error) throw new Error(`Error inserting reviews: ${error.message}`);
      completed.reviews = true;
    }

    // *** Attractions (Points of Interest)
    await supabaseServer.from("attractions").delete().eq("listing_id", listing.id);
    if (attractions?.length) {
      const attractionRows = attractions.map((a) => ({
        listing_id: listing.id,
        name: a.name,
        types: a.types,
        location: a.location,
        description: a.description,
        photos: a.photos,
      }));
      const { error } = await supabaseServer.from("attractions").insert(attractionRows);
      if (error) throw new Error(`Error inserting attractions: ${error.message}`);
      completed.attractions = true;
    }

    // *** Accessibility
    await supabaseServer.from("accessibility").delete().eq("listing_id", listing.id);
    if (accessibility?.length) {
      const accRows = accessibility.map((a) => ({
        listing_id: listing.id,
        type: a.type,
        title: a.title,
        subtitle: a.subtitle,
        available: a.available,
        images: a.images,
      }));
      const { error } = await supabaseServer.from("accessibility").insert(accRows);
      if (error) throw new Error(`Error inserting accessibility: ${error.message}`);
      completed.accessibility = true;
    }

    return true;
  } catch (error) {
    // Compensation: attempt to delete all previously inserted/updated data for this listing
    try {
      const id = listingData.listing.id;
      if (completed.reviews) await supabaseServer.from("reviews").delete().eq("listing_id", id);
      if (completed.safety_property) await supabaseServer.from("safety_property").delete().eq("listing_id", id);
      if (completed.house_rules) await supabaseServer.from("house_rules").delete().eq("listing_id", id);
      if (completed.availability) await supabaseServer.from("availability").delete().eq("listing_id", id);
      if (completed.tour) await supabaseServer.from("tour").delete().eq("listing_id", id);
      if (completed.photos) await supabaseServer.from("photos").delete().eq("listing_id", id);
      if (completed.amenities) await supabaseServer.from("amenities").delete().eq("listing_id", id);
      if (completed.location_details) await supabaseServer.from("location_details").delete().eq("listing_id", id);
      if (completed.listing) await supabaseServer.from("listings").delete().eq("id", id);
      if (completed.site) await supabaseServer.from("sites").delete().eq("host_id", listingData.host.id);
      if (completed.host) await supabaseServer.from("hosts").delete().eq("id", listingData.host.id);
      if (completed.attractions) await supabaseServer.from("attractions").delete().eq("listing_id", id);
      if (completed.accessibility) await supabaseServer.from("accessibility").delete().eq("listing_id", id);
      console.log("✔ Successfully rolled back previous insertions");
    } catch (compError) {
      console.error("❌ Compensation (rollback) failed:", compError);
    }
    console.error("❌ saveListingData failed:", error);
    return false;
  }
}
