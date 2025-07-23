export default async function SitePage({
  params,
}: {
  params: Promise<{ mainSlug: string; dynamicSegments: string[] }>;
}) {
  const { mainSlug, dynamicSegments } = await params;

  console.log(mainSlug, dynamicSegments);
  return (
    <div>
      Site current path: {mainSlug}, dynamic segments: {dynamicSegments.join("/")}
    </div>
  );
}
