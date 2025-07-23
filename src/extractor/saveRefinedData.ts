import { supabaseServer } from "@/utils/supabase";
import { RefinedData } from "./types";

/**
 * Persists a complete RefinedData object into Supabase refines table according to schema.sql.
 * Uses upsert with the unique constraint on listing_id to ensure there's only one
 * refined data record per listing.
 *
 * @param refinedData - The refined data object to save
 * @param listingId - The ID of the listing to associate with this refined data
 * @returns Promise resolving to true if successful, false otherwise
 */
export default async function saveRefinedData(refinedData: RefinedData, listingId: string): Promise<boolean> {
  const { brandingIdentity, topReviews, description } = refinedData;
  let refineSaved = false;

  try {
    // Use upsert with onConflict to update existing record or insert new one
    const { error } = await supabaseServer.from("refines").upsert(
      {
        listing_id: listingId,
        branding: brandingIdentity,
        top_reviews: JSON.stringify(topReviews),
        description,
      },
      { onConflict: "listing_id" }
    );

    if (error) {
      throw new Error(`Error upserting refined data: ${error.message}`);
    }
    
    refineSaved = true;
    return true;
  } catch (error) {
    // Compensation: attempt to delete all previously inserted/updated data for this listing
    try {
      // First clean up the refines data if it was saved
      if (refineSaved) {
        await supabaseServer.from("refines").delete().eq("listing_id", listingId);
      }
      
      // Then clean up all related listing data
      await supabaseServer.from("reviews").delete().eq("listing_id", listingId);
      await supabaseServer.from("safety_property").delete().eq("listing_id", listingId);
      await supabaseServer.from("house_rules").delete().eq("listing_id", listingId);
      await supabaseServer.from("availability").delete().eq("listing_id", listingId);
      await supabaseServer.from("tour").delete().eq("listing_id", listingId);
      await supabaseServer.from("photos").delete().eq("listing_id", listingId);
      await supabaseServer.from("amenities").delete().eq("listing_id", listingId);
      await supabaseServer.from("location_details").delete().eq("listing_id", listingId);
      await supabaseServer.from("attractions").delete().eq("listing_id", listingId);
      await supabaseServer.from("accessibility").delete().eq("listing_id", listingId);
      
      // Get the listing to find host_id before deleting the listing
      const { data: listingData } = await supabaseServer
        .from("listings")
        .select("site_id")
        .eq("id", listingId)
        .single();
      
      if (listingData?.site_id) {
        // Get the site to find host_id
        const { data: siteData } = await supabaseServer
          .from("sites")
          .select("host_id")
          .eq("id", listingData.site_id)
          .single();
        
        // Delete the listing
        await supabaseServer.from("listings").delete().eq("id", listingId);
        
        if (siteData?.host_id) {
          // Delete the site
          await supabaseServer.from("sites").delete().eq("host_id", siteData.host_id);
          // Delete the host
          await supabaseServer.from("hosts").delete().eq("id", siteData.host_id);
        }
      }
      
      console.log("✔ Successfully rolled back all data for listing", listingId);
    } catch (compError) {
      console.error("❌ Compensation (rollback) failed:", compError);
    }
    
    console.error("❌ saveRefinedData failed:", error);
    return false;
  }
}
