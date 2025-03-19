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

// English speaking countries data for playwright setup
export const proxyCountriesData = [
  "gb|en|en-GB|Europe/London|(en-GB)|UK",
  "ie|en|en-IE|Europe/Dublin|(en-IE)|Ireland",
  "mt|en|en-MT|Europe/Malta|(en-MT)|Malta",
  "au|en|en-AU|Australia/Sydney|(en-AU)|Australia",
  "in|en|en-IN|Asia/Kolkata|(en-IN)|India",
  "za|en|en-ZA|Africa/Johannesburg|(en-ZA)|South Africa",
  "ca|en|en-CA|America/Toronto|(en-CA)|Canada",
  // "de|de|de-DE|Europe/Berlin|(de)|Germany",
  // "fr|fr|fr-FR|Europe/Paris|(fr)|France",
  // "it|it|it-IT|Europe/Rome|(it)|Italy",
  // "es|es|es-ES|Europe/Madrid|(es)|Spain",
  // "nl|nl|nl-NL|Europe/Amsterdam|(nl)|Netherlands",
  // "sv|sv|sv-SE|Europe/Stockholm|(sv-SE)|Sweden",
  // "no|nb|nb-NO|Europe/Oslo|(nb-NO)|Norway",
];
