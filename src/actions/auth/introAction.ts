"use server";

// Define the type for the previous state
type IntroState = {
  success: boolean;
  message: string;
  listingId?: string;
};

export async function introAction(prevState: IntroState, formData: FormData) {
  // Get the listing ID from the form data
  const listingId = formData.get("listingId") as string;
  
  console.log("Received listing ID:", listingId);
  
  // Here you can use the listingId for any processing you need
  
  return {
    success: true,
    message: "Intro completed successfully",
    listingId, // Return the listingId in the response if needed
  };
}
