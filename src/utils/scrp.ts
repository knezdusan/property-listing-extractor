/**
 * Use Playwright to extract AirBnB property listing data
 * @param url URL of the listing
 * @param proxy Proxy configuration
 * @returns html string
 */

import { firefox } from "playwright"; // Use Firefox for better stealth
import { euCountriesData, randomDelay } from "./helpers";

export async function scrp(url: string, proxy: string): Promise<string> {
  console.log(`➜➜➜➜ Extracting listing data with proxy ${proxy} ...`);

  const [server, username, password] = proxy.split("|");

  // extract the country code from the password eg us, gb, de, fr, it, es, nl, sv, no, ie
  const countryCode = password.split("-")[1];

  const proxyData =
    countryCode === "us"
      ? "us|en|en-US|America/New_York|en-US|USA"
      : euCountriesData.find((data) => data.includes(countryCode)); // eg. "gb|en|en-GB|Europe/London|(en-GB)|UK"

  if (!proxyData) {
    console.error("✘ Invalid proxy country data");
    return "";
  }

  const [, language, locale, timezone] = proxyData.split("|");
  const acceptLanguage = `${locale},${language};q=0.9`;

  return "";
}
