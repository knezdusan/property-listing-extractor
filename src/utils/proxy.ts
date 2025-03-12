/**
 * Fetches a pool of residential proxies from iProyal API
 * 6 US proxies and 4 UE proxies then shuffle them
 * exmple output: [
 *   "https://username:password@hostname:port",
 * ]
 */

import { shuffleArray } from "@/utils/helpers";

export async function fetchRandomProxies() {
  console.log("Fetching proxies...");
  const usProxyPool = await fetchProxyPool(6, "_country-us");
  const euProxyPool = await fetchProxyPool(4, "_region-europe");
  const combinedPool = [...usProxyPool, ...euProxyPool];

  if (!combinedPool.length) {
    console.error("Failed to fetch proxies");
    return [];
  }

  return shuffleArray(combinedPool);
}

/**
 * Fetches a pool of residential proxies from iProyal API
 * @param count Number of proxies to fetch
 * @param location Location of the proxies (e.g., "_region-europe" or "_country-us")
 * @returns Array of proxy configurations
 */
async function fetchProxyPool(
  count: number = 10,
  location: string = "_country-us"
): Promise<string[]> {
  try {
    const hostname = process.env.PROXY_HOSTNAME;
    const username = process.env.PROXY_USERNAME;
    const password = process.env.PROXY_PASSWORD;
    const API_TOKEN = process.env.PROXY_API_TOKEN;

    if (!API_TOKEN) {
      console.error("Missing PROXY_API_TOKEN environment variable");
      return [];
    }

    if (!hostname || !username || !password) {
      console.error("Missing proxy configuration in environment variables");
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

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response:", {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText,
      });
      return [];
    }

    const proxyStrings = await response.json();
    if (!proxyStrings) {
      return [];
    }

    const proxyList = proxyStrings.map((proxyString: string) => {
      const [hostname, port, username, password] = proxyString.split(":");
      return `https://${username}:${password}@${hostname}:${port}`;
    });

    return proxyList;
  } catch (error) {
    console.error(`Error fetching proxy pool for ${location}:`, error);
    return [];
  }
}
