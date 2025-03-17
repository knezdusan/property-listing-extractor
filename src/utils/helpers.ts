// Helper function: Random delay to mimic human behavior
export const randomDelay = (min = 500, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Helper function: Shuffles an array randomly
export function shuffleArray<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }

  return shuffled;
}

// EU countries data for playwright setup
export const euCountriesData = [
  "gb|en|en-GB|Europe/London|(en-GB)|UK",
  "de|de|de-DE|Europe/Berlin|(de)|Germany",
  "fr|fr|fr-FR|Europe/Paris|(fr)|France",
  "it|it|it-IT|Europe/Rome|(it)|Italy",
  "es|es|es-ES|Europe/Madrid|(es)|Spain",
  "nl|nl|nl-NL|Europe/Amsterdam|(nl)|Netherlands",
  "sv|sv|sv-SE|Europe/Stockholm|(sv-SE)|Sweden",
  "no|nb|nb-NO|Europe/Oslo|(nb-NO)|Norway",
  "ie|en|en-IE|Europe/Dublin|(en-IE)|Ireland",
];

// Sample listing URLs for testing
export const sampleListingUrls = [
  "https://www.airbnb.com/rooms/54224514?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A7769&photo_id=1681248496&source_impression_id=p3_1741704626_P3lHKQxK5W_lvguI&previous_page_section_name=1001&federated_search_id=8454c61d-56e0-479a-a1df-e5ff517a0901",
  "https://www.airbnb.com/rooms/994154497003373425?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A7769&photo_id=1751790506&source_impression_id=p3_1741704638_P3O90Uyoy4OE4hCj&previous_page_section_name=1001&federated_search_id=3ac2c407-53c4-4176-94a7-537c8466d288",
  "https://www.airbnb.com/rooms/1122082717395447567?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8535&photo_id=1870816101&source_impression_id=p3_1741704677_P3SgKhw9kcBegBM6&previous_page_section_name=1001&federated_search_id=9c38b254-49f7-4a99-9d8a-6d6723010c10",
  "https://www.airbnb.com/rooms/625479145439568235?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8678&photo_id=1399399870&source_impression_id=p3_1741704649_P3RXq4ZfdSq-33sE&previous_page_section_name=1001&federated_search_id=1e03e26c-b742-49d9-9601-8385856537a4",
  "https://www.airbnb.com/rooms/53478370?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8525&photo_id=1500679971&source_impression_id=p3_1741704698_P3qwEPAcNYhMQRQQ&previous_page_section_name=1001&federated_search_id=f230411d-5f67-4321-b185-7885d41a0e0b",
  "https://www.airbnb.com/rooms/1366902581451022614?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8148&photo_id=2098753444&source_impression_id=p3_1741704761_P31zk7ze3yllYw0M&previous_page_section_name=1001&federated_search_id=ea30bd7f-6fe6-41a9-b322-b57cb2c331d5",
  "https://www.airbnb.com/rooms/704345975719106602?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8536&photo_id=1481296821&source_impression_id=p3_1741704737_P3T7tpQ-HNCMqZrA&previous_page_section_name=1001&federated_search_id=58d011be-2a6c-4147-947c-87c0156f5dfd",
  "https://www.airbnb.com/rooms/48023999?check_in=2025-04-01&check_out=2025-04-10&location=United%20States&search_mode=regular_search&category_tag=Tag%3A8526&photo_id=1546132884&source_impression_id=p3_1741704717_P3cqPm5jS3FeQWUh&previous_page_section_name=1001&federated_search_id=ed20b5d6-93ac-4efb-b978-c365202a3da9",
];
