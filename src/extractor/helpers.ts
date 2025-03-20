import { load } from "cheerio";

// Clear HTML content of non-essential tags and attributes
export function clearHtml(html: string) {
  const $ = load(html);

  // Save JSON-LD structured data before removing scripts
  const jsonLdData: string[] = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    jsonLdData.push($(el).html() || "");
  });

  // Remove non-essential tags
  $("script:not([type='application/ld+json']), style, noscript, iframe, svg").remove();

  // Important attribute prefixes and names to preserve
  const preserveAttributePrefixes = ["data-", "aria-"];
  const importantAttributes = [
    "id",
    "src",
    "alt",
    "href",
    "content",
    "class",
    "title",
    "datetime",
    "itemprop",
    "property",
    "name",
    "rel",
    "type",
    "value",
    "placeholder",
    "role",
    "lang",
    "dir",
  ];
  const preserveElementsWithAllAttribs = [
    "meta",
    "link",
    "img",
    "a",
    "time",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ];

  // Strip attributes selectively
  $("*").each((i, el) => {
    if ("attribs" in el) {
      // Preserve all attributes for specific elements
      if (preserveElementsWithAllAttribs.includes(el.tagName)) {
        return;
      }

      // For other elements, selectively keep important attributes
      const attributeKeys = Object.keys(el.attribs);
      for (const key of attributeKeys) {
        // Check if this attribute should be preserved
        const isPrefixMatch = preserveAttributePrefixes.some((prefix) => key.startsWith(prefix));
        const isImportantAttribute = importantAttributes.includes(key);

        if (!isPrefixMatch && !isImportantAttribute) {
          delete el.attribs[key];
        }
      }
    }
  });

  // Reinsert JSON-LD data
  if (jsonLdData.length > 0) {
    jsonLdData.forEach((data) => {
      $("head").append(`<script type="application/ld+json">${data}</script>`);
    });
  }

  // Remove empty tags to reduce noise
  $("*").each((i, el) => {
    if (!$(el).text().trim() && !$(el).children().length && !$(el).is("meta, link, img, input")) $(el).remove();
  });

  // Normalize whitespace
  return $.html().replace(/\s+/g, " ").trim();
}
