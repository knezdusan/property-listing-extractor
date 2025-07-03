import path from "path";
import { readFile, writeFile } from "fs/promises";
import { destroyAuthSession } from "./auth";

// Helper function: Slugify a string (no input validation version)
export function slugify(string: string) {
  const a = "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b = "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuwnxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special chars
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Pauses execution for the given number of seconds.
 * @param seconds Number of seconds to pause (can be fractional).
 * @returns Promise that resolves after the specified delay.
 */
export async function wait(seconds: number): Promise<void> {
  if (seconds < 1) {
    return;
  }
  const ms = Math.max(0, seconds * 1000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function: Random delay to mimic human behavior
export const randomDelay = (min = 500, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Helper function: Generate a random string - for the activation code
export const generateActivationCode = () => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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

// Helper function: Checks if a string is a valid month-year format like "June 2023"
export function isValidMonthYear(monthYearString: string) {
  const parts = monthYearString.split(" ");
  if (parts.length !== 2) {
    return false; // Incorrect format
  }

  const monthName = parts[0];
  const yearString = parts[1];
  const year = parseInt(yearString, 10);

  if (isNaN(year) || year < 1000 || year > 9999) {
    return false; // Invalid year format
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = monthNames.indexOf(monthName);

  return monthIndex !== -1; // Month name is valid
}

// Helper function getWithRetry
export async function getWithRetry<T>(getFunction: () => Promise<T>, MAX_RETRIES = 3, getWhat: string) {
  let result = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`➜ ${getWhat} - (attempt ${attempt}/${MAX_RETRIES})...`);
    result = await getFunction();

    if (result) {
      console.log(`✔ ${getWhat} succesfull - on attempt ${attempt}`);
      break;
    }

    if (attempt < MAX_RETRIES) {
      // Wait with increasing backoff between retries (1s, 2s, 4s...)
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏱ Waiting ${delayMs}ms before retry ${attempt + 1}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (!result) {
    console.error(`❌ ${getWhat} failed after ${MAX_RETRIES} attempts`);
    return null;
  }
  return result;
}

// Helper function: Save string content to file
export async function saveToFile(content: string, filePath: string) {
  const filePathFull = path.join(process.cwd(), filePath);
  try {
    await writeFile(filePathFull, content, "utf-8");
    console.log(`✔ Saved content to ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to save content to ${filePath}:`, error);
  }
}

// Helper function: Read string content from file
export async function readFromFile(filePath: string) {
  const filePathFull = path.join(process.cwd(), filePath);
  try {
    const content = await readFile(filePathFull, "utf-8");
    console.log(`✔ Read content from ${filePath}`);
    return content;
  } catch (error) {
    console.error(`❌ Failed to read content from ${filePath}:`, error);
    return null;
  }
}

/**
 * Checks if a user has reached the retry limit and handles retry logic.
 * This function:
 * 1. Resets retries if 24 hours have passed since last attempt
 * 2. Updates the user's retry count
 * 3. Applies a progressive delay based on retry count
 * 4. Determines if the retry limit has been reached
 *
 * @param userData The user data object containing updated_at and retries
 * @param userId The user ID or email to update
 * @param applyDelay Whether to apply the progressive delay (default: true)
 * @returns A boolean indicating if the retry limit has been reached
 */
export async function checkUserRetryLimit(
  userData: { updated_at: Date; retries: number },
  userId: string,
  applyDelay: boolean = true
): Promise<boolean> {
  // Import necessary functions from supabase utils
  const { updateUserTimestamp, updateRetries } = await import("@/utils/supabase");

  // Reset user retries if 24 hours have passed since last attempt
  if (userData.updated_at < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    userData.retries = 0;
    await updateUserTimestamp(userId);
  }

  // Update user retries
  await updateRetries(userId, userData.retries);

  // Apply progressive delay based on retry count if requested
  if (applyDelay) {
    await wait(userData.retries);
  }

  // Check if user retries limit is reached
  const maxRetries = Number(process.env.NEXT_PUBLIC_AUTH_MAX_RETRIES ?? 5);

  // If user retries limit is reached, destroy auth session and return true
  if (userData.retries >= maxRetries) {
    await destroyAuthSession();
    return true;
  }

  return false;
}

// Check data structure type (object, array, primitive or null)
export function checkStructureType(structure: unknown): string | null {
  // Check if the structure is empty
  if (!structure) {
    return null;
  }

  // Check if the structure is an object
  if (typeof structure === "object") {
    return "object";
  }

  // Check if the structure is an array
  if (Array.isArray(structure)) {
    return "array";
  }

  // If structure is a primitive
  return "primitive";
}

/**
 * Checks if a value is a plain JavaScript object (excluding arrays and null).
 * Uses a type predicate for type narrowing.
 * @param value The value to check.
 * @returns `true` if the value is a non-null object and not an array, `false` otherwise.
 *          If true, TypeScript knows `value` is a `Record<keyof string, unknown>` within the conditional block.
 */
export function isObject(value: unknown): value is Record<keyof string, unknown> {
  // 1. Check if it's an object type
  // 2. Ensure it's not null (typeof null === 'object')
  // 3. Ensure it's not an array (arrays are objects too)
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is an array.
 * Uses a type predicate for type narrowing.
 * @param value The value to check.
 * @returns `true` if the value is an array, `false` otherwise.
 *          If true, TypeScript knows `value` is `unknown[]` within the conditional block.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Returns the full name of a US state given its abbreviation.
 * @param abbreviation The 2-letter abbreviation of the state.
 * @returns The full name of the state, or throws an error if the abbreviation is invalid.
 */
export function getStateName(abbreviation: string): string | null {
  // Validate input
  if (typeof abbreviation !== "string" || abbreviation.length !== 2) {
    return null;
  }

  const normalizedAbbr = abbreviation.toUpperCase();

  if (!(normalizedAbbr in US_STATES)) {
    return null;
  }

  // Type assertion is safe after the check above
  return US_STATES[normalizedAbbr as StateAbbreviation];
}

/**
 * Returns the full name of a country given its abbreviation.
 * @param abbreviation The 2-letter abbreviation of the country.
 * @returns The full name of the country, or throws an error if the abbreviation is invalid.
 */
export function getCountryName(abbreviation: string): string | null {
  // Validate input
  if (typeof abbreviation !== "string" || abbreviation.length !== 2) {
    return null;
  }

  const normalizedAbbr = abbreviation.toUpperCase();

  if (!(normalizedAbbr in COUNTRIES)) {
    return null;
  }

  // Type assertion is safe after the check above
  return COUNTRIES[normalizedAbbr as CountryCode];
}

/**
 * Parses an Airbnb URL to extract the listing ID and type.
 * @param url The Airbnb URL to parse.
 * @returns An object containing the parsed URL, listing ID, and type (room or home).
 * eg. { url: 'https://www.airbnb.com/rooms/123456', id: '123456', type: 'room' }
 */
export function parseAirbnbUrl(airbnbUrl: string): { url: string; id: string; type: string; tld: string } {
  let id: string = "";
  let type: string = "room"; // Default to room type

  // Extract URL without query parameters
  const url = airbnbUrl.split("?")[0];

  // Extract listing ID and type
  if (url.includes("/rooms/")) {
    id = url.split("/rooms/")[1].split("?")[0];
    type = "room";
  } else if (url.includes("/h/")) {
    id = url.split("/h/")[1].split("?")[0];
    type = "home";
  } else {
    // If URL format is unrecognized, attempt to extract any numeric sequence as ID
    const numericMatch = url.match(/[0-9]{6,25}/);
    if (numericMatch) {
      id = numericMatch[0];
    }
  }

  // Extract TLD (e.g., 'com', 'co.uk', 'fr')
  const tldMatch = url.match(/\.([a-z]{2,6})(\/|$)/i);
  const tld = tldMatch ? tldMatch[1].toLowerCase() : "com"; // Default to 'com' if no match

  return {
    url,
    id,
    type,
    tld,
  };
}

/**
 * Checks if a string is a valid UUID.
 * @param uuid The string to check.
 * @returns `true` if the string is a valid UUID, `false` otherwise.
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/* -------------------------------------- Helper Constants and Types --------------------------------------- */

// US States abbreviations to names
export const US_STATES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
  PR: "Puerto Rico",
  UM: "U.S. Minor Outlying Islands",
  VI: "U.S. Virgin Islands",
};

export const COUNTRIES = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua and Barbuda",
  AI: "Anguilla",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AQ: "Antarctica",
  AR: "Argentina",
  AS: "American Samoa",
  AT: "Austria",
  AU: "Australia",
  AW: "Aruba",
  AX: "Åland Islands",
  AZ: "Azerbaijan",
  BA: "Bosnia and Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BL: "Saint Barthélemy",
  BM: "Bermuda",
  BN: "Brunei Darussalam",
  BO: "Bolivia (Plurinational State of)",
  BQ: "Bonaire, Sint Eustatius and Saba",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BV: "Bouvet Island",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CC: "Cocos (Keeling) Islands",
  CD: "Congo, Democratic Republic of the",
  CF: "Central African Republic",
  CG: "Congo",
  CH: "Switzerland",
  CI: "Côte d'Ivoire",
  CK: "Cook Islands",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CV: "Cabo Verde",
  CW: "Curaçao",
  CX: "Christmas Island",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DM: "Dominica",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  EH: "Western Sahara",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands (Malvinas)",
  FM: "Micronesia (Federated States of)",
  FO: "Faroe Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom of Great Britain and Northern Ireland",
  GD: "Grenada",
  GE: "Georgia",
  GF: "French Guiana",
  GG: "Guernsey",
  GH: "Ghana",
  GI: "Gibraltar",
  GL: "Greenland",
  GM: "Gambia",
  GN: "Guinea",
  GP: "Guadeloupe",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GS: "South Georgia and the South Sandwich Islands",
  GT: "Guatemala",
  GU: "Guam",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HK: "Hong Kong",
  HM: "Heard Island and McDonald Islands",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IM: "Isle of Man",
  IN: "India",
  IO: "British Indian Ocean Territory",
  IQ: "Iraq",
  IR: "Iran (Islamic Republic of)",
  IS: "Iceland",
  IT: "Italy",
  JE: "Jersey",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KI: "Kiribati",
  KM: "Comoros",
  KN: "Saint Kitts and Nevis",
  KP: "Korea (Democratic People's Republic of)",
  KR: "Korea, Republic of",
  KW: "Kuwait",
  KY: "Cayman Islands",
  KZ: "Kazakhstan",
  LA: "Lao People's Democratic Republic",
  LB: "Lebanon",
  LC: "Saint Lucia",
  LI: "Liechtenstein",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova, Republic of",
  ME: "Montenegro",
  MF: "Saint Martin (French part)",
  MG: "Madagascar",
  MH: "Marshall Islands",
  MK: "North Macedonia",
  ML: "Mali",
  MM: "Myanmar",
  MN: "Mongolia",
  MO: "Macao",
  MP: "Northern Mariana Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MS: "Montserrat",
  MT: "Malta",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NC: "New Caledonia",
  NE: "Niger",
  NF: "Norfolk Island",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NR: "Nauru",
  NU: "Niue",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PF: "French Polynesia",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PM: "Saint Pierre and Miquelon",
  PN: "Pitcairn",
  PR: "Puerto Rico",
  PS: "Palestine, State of",
  PT: "Portugal",
  PW: "Palau",
  PY: "Paraguay",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russian Federation",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SG: "Singapore",
  SH: "Saint Helena, Ascension and Tristan da Cunha",
  SI: "Slovenia",
  SJ: "Svalbard and Jan Mayen",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SM: "San Marino",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  ST: "Sao Tome and Principe",
  SV: "El Salvador",
  SX: "Sint Maarten (Dutch part)",
  SY: "Syrian Arab Republic",
  SZ: "Eswatini",
  TC: "Turks and Caicos Islands",
  TD: "Chad",
  TF: "French Southern Territories",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TK: "Tokelau",
  TL: "Timor-Leste",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TO: "Tonga",
  TR: "Turkey",
  TT: "Trinidad and Tobago",
  TV: "Tuvalu",
  TW: "Taiwan, Province of China",
  TZ: "Tanzania, United Republic of",
  UA: "Ukraine",
  UG: "Uganda",
  UM: "United States Minor Outlying Islands",
  US: "United States of America",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VA: "Holy See",
  VC: "Saint Vincent and the Grenadines",
  VE: "Venezuela (Bolivarian Republic of)",
  VG: "Virgin Islands (British)",
  VI: "Virgin Islands (U.S.)",
  VN: "Viet Nam",
  VU: "Vanuatu",
  WF: "Wallis and Futuna",
  WS: "Samoa",
  YE: "Yemen",
  YT: "Mayotte",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

export type StateAbbreviation = keyof typeof US_STATES;
export type CountryCode = keyof typeof COUNTRIES;

// Override console.warn and console.error to color warnings and errors
const RESET = "\x1b[0m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

console.warn = (...args: unknown[]) => {
  process.stdout.write(YELLOW);
  console.log(...args);
  process.stdout.write(RESET);
};

console.error = (...args: unknown[]) => {
  process.stdout.write(RED);
  console.log(...args);
  process.stdout.write(RESET);
};
