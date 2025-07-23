export default async function SiteHomePage({ params }: { params: Promise<{ mainSlug: string }> }) {
  const { mainSlug } = await params;

  console.log(mainSlug);
  return <div>Site current path: {mainSlug}</div>;
}
