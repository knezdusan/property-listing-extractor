import { getListingData } from "@/extractor/getListingData";
import { readFromFile, saveToFile } from "@/utils/helpers";
import { AirbnbApiData } from "@/extractor/types";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default async function TransformPage() {
  // Read the apiData to src/data/apiData.json
  const apiDataString = await readFromFile("src/extractor/data/apiData.json");

  if (!apiDataString) {
    return <ErrorDisplay errorMessage="Failed to read API data" />;
  }

  // Parse the string into a JavaScript object
  let apiData: AirbnbApiData;
  try {
    apiData = JSON.parse(apiDataString) as AirbnbApiData;
  } catch (error) {
    console.error("❌ Failed to parse API data:", error);
    return <ErrorDisplay errorMessage={`Failed to parse API data: ${String(error)}`} />;
  }

  // Transform the apiData to property data ----------------------------------------------------------
  const propertyData = getListingData(apiData);
  if (propertyData) {
    console.log("✔ Successfully transformed property data from apiData");

    // Save the property data to src/data/propertyData.json
    console.log("➜ Saving property data to propertyData.json");
    await saveToFile(JSON.stringify(propertyData), "src/extractor/data/propertyData.json");
  } else {
    console.error("❌ Failed to transform property data");
    return <ErrorDisplay errorMessage="Failed to transform property data" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Transform Page</h1>
      <div className="bg-white shadow-md rounded p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-2">API Data</h2>
        <pre className="text-sm overflow-auto max-h-[600px]">{JSON.stringify(propertyData, null, 2)}</pre>
      </div>
    </div>
  );
}
