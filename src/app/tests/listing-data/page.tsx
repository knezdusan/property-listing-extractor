import { readFromFile } from "@/utils/helpers";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { LISTING_DATA_PATHS } from "@/extractor/selectors";

export default async function ListingDataPage() {
  // Read the listing data JSON from data folder
  const listingDataString = await readFromFile(LISTING_DATA_PATHS.listingData);

  if (!listingDataString) {
    return <ErrorDisplay errorMessage="Failed to read listing data" />;
  }

  return (
    <div>
      <div className="bg-white shadow-md rounded p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-2">Listing Data</h2>
        <pre className="text-sm overflow-auto max-h-[600px]">
          {JSON.stringify(JSON.parse(listingDataString), null, 2)}
        </pre>
      </div>
    </div>
  );
}
