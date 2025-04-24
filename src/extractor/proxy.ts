import { shuffleArray } from "@/utils/helpers";

// English speaking countries data for Playwright proxy setup
const proxyCountriesData = [
  "gb|en|en-GB|Europe/London|(en-GB)|UK",
  "ie|en|en-IE|Europe/Dublin|(en-IE)|Ireland",
  "mt|en|en-MT|Europe/Malta|(en-MT)|Malta",
  "au|en|en-AU|Australia/Sydney|(en-AU)|Australia",
  "in|en|en-IN|Asia/Kolkata|(en-IN)|India",
  "za|en|en-ZA|Africa/Johannesburg|(en-ZA)|South Africa",
  "ca|en|en-CA|America/Toronto|(en-CA)|Canada",
];

interface ProxyData {
  server: string;
  username: string;
  password: string;
  language: string;
  locale: string;
  timezone: string;
  acceptLanguage: string;
}

/**
 * Fetches a single residential Proxy from rendom proxy pool
 * @returns Null or ProxyData Object with proxy data formated for PlayWright
 */
export async function getProxyData(): Promise<ProxyData | null> {
  const randomProxyPool = await fetchRandomProxies();
  if (randomProxyPool.length === 0) return null;

  const singleProxy = randomProxyPool[0];
  console.log(`➜ Fetching single proxy datat from random proxy pool: ${singleProxy}`);

  // Extract the server, username, and password from the proxy string -----------------------------
  const [server, username, password] = singleProxy.split("|");

  // extract the country code from the password eg. us, gb, ie, za, ca, au, in
  const countryCode = password.split("-")[1];
  const proxyData =
    countryCode === "us"
      ? "us|en|en-US|America/New_York|en-US|USA"
      : proxyCountriesData.find((data) => data.includes(countryCode)); // eg. "gb|en|en-GB|Europe/London|(en-GB)|UK"
  if (!proxyData) {
    console.error("❌ Invalid proxy country data");
    return null;
  }

  const [, language, locale, timezone] = proxyData.split("|");
  const acceptLanguage = `${locale},${language};q=0.9`;

  return {
    server,
    username,
    password,
    language,
    locale,
    timezone,
    acceptLanguage,
  };
}

/**
 * Fetches a pool of residential proxies from iProyal API
 * 6 US proxies and 4 non-US English speaking proxies then shuffle them
 * exmple output: [
 *   "https://username:password@hostname:port",
 * ]
 */
async function fetchRandomProxies(): Promise<string[]> {
  console.log("➜ Fetching proxy pool...");

  // fetch 4 random country proxies
  const proxyPool: string[] = [];
  const countries = shuffleArray(proxyCountriesData).slice(0, 4);
  const locations = countries.map((country) => country.split("|")[0]); // like gb, de, fr, it, es, nl, sv, no, ie

  // Try to fetch at least some proxies, continue even if some fail
  for (const location of locations) {
    try {
      const locationProxies = await fetchProxyPool(1, `_country-${location}`);
      if (locationProxies.length > 0) {
        proxyPool.push(...locationProxies);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to fetch proxies for ${location}, skipping: ${errorMessage}`);
      // Continue with other locations even if one fails
    }
  }

  // fetch 6 US proxies
  let usProxyPool: string[] = [];
  try {
    usProxyPool = await fetchProxyPool(6, "_country-us");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to fetch US proxies, skipping: ${errorMessage}`);
  }

  const combinedPool = [...usProxyPool, ...proxyPool];

  if (!combinedPool.length) {
    console.error("❌ Failed to fetch any proxies");
    return [];
  }

  if (combinedPool.length < 3) {
    console.warn(`⚠️ Limited proxy pool: ${combinedPool.length} proxies available`, combinedPool);
  } else {
    console.log(`✔ Successfully fetched ${combinedPool.length} proxies for rotation`, combinedPool);
  }

  return shuffleArray(combinedPool);
}

/**
 * Fetches a pool of residential proxies from iProyal API
 * @param count Number of proxies to fetch
 * @param location Location of the proxies (e.g., "_region-europe" or "_country-us")
 * @returns Array of proxy configurations
 */
async function fetchProxyPool(count: number = 10, location: string = "_country-us"): Promise<string[]> {
  // Simple retry mechanism
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const hostname = process.env.PROXY_HOSTNAME;
      const username = process.env.PROXY_USERNAME;
      const password = process.env.PROXY_PASSWORD;
      const API_TOKEN = process.env.PROXY_API_TOKEN;

      if (!API_TOKEN) {
        console.error("❌ Missing PROXY_API_TOKEN environment variable");
        return [];
      }

      if (!hostname || !username || !password) {
        console.error("❌ Missing proxy configuration in environment variables");
        return [];
      }

      const url = "https://resi-api.iproyal.com/v1/access/generate-proxy-list";

      const data = {
        format: "{hostname}:{port}:{username}:{password}",
        hostname: hostname,
        port: "http|https",
        rotation: "random",
        location: location,
        proxy_count: count,
        username: username,
        password: password,
      };

      try {
        console.log(`⏱ Fetching proxies for ${location}... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(` - API returned ${response.status}: ${response.statusText}`);
        }

        const proxyStrings = await response.json();
        if (!proxyStrings || !Array.isArray(proxyStrings) || proxyStrings.length === 0) {
          throw new Error(" - API returned empty or invalid proxy list");
        }

        const proxyList = proxyStrings.map((proxyString: string) => {
          const [hostname, port, username, password] = proxyString.split(":");
          return `https://${hostname}:${port}|${username}|${password}`;
        });

        return proxyList;
      } catch (fetchError) {
        console.error("❌ Request timed out after 5 seconds" + fetchError);
        return [];
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error fetching proxy pool for ${location}: ${errorMessage}`);

      // If we have retries left, try again
      if (attempt < maxRetries) {
        attempt++;
        console.log(`⏱ Retrying (${attempt}/${maxRetries})...`);
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        return [];
      }
    }
  }

  return [];
}
