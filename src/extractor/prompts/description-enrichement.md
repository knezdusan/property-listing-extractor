# Property Listing Enhancement Instructions

Your task is to process a property listing description in two steps:

## Step 1: Preserve Original Content

- Keep the original description EXACTLY as provided with no changes
- Preserve ALL formatting (ALL CAPS, line breaks, special characters)

## Step 2: Add Content (Only If Needed)

- If original is under 150 words: Add content to reach 300+ words
- If original is 150+ words: Make NO additions

When adding content:

- Separate with "--- ADDITIONAL FEATURES ---"
- Create FOUR paragraphs using different sources:
  1. First paragraph: Use property highlights information
  2. Second paragraph: Use location/tags information
  3. Third paragraph: Use amenities from reviews
  4. Fourth paragraph: A brief call-to-action conclusion (2-3 sentences)
- NEVER mention guests, reviews, or opinions
- NEVER duplicate information from the original
- Write as if you are the property host
- Match the original writing style
- The call-to-action should encourage booking without being pushy

**OUTPUT REQUIREMENTS:**

Your output should be the enhanced property description text only.

1. If the original is under 150 words: Return the original description followed by additional content
2. If the original is 150+ words: Return the original description unchanged
3. When adding content, use "\n\n--- ADDITIONAL FEATURES ---\n\n" to separate original from additions

**INPUT DATA:**

Original Description: {listing.description}

Property Highlights: {listing.highlights}

Property Tags: {listing.tags}

Top Reviews: {top_reviews}

**TASK SUMMARY:**

1. Preserve original description exactly
2. If under 150 words, add four paragraphs of new content
3. Return the enhanced text directly

**OUTPUT FORMAT:**

Return only the enhanced description text. No JSON, no explanations, just the text itself.

**IMPORTANT NOTES:**

- If original is 150+ words: Do not add any content
- Preserve ALL formatting including capitalization and spacing
- Use "--- ADDITIONAL FEATURES ---" between sections
- Write FOUR paragraphs from different data sources
- Write as if you are the property host
- NEVER mention guests or reviews
- NEVER duplicate information

**EXAMPLES:**

✓ "The villa features a beautiful outdoor space with a pool area"
✗ "Guests have praised this villa for its beautiful outdoor space"

✓ "The property is a 5-minute walk from the local supermarket"
✗ Mentioning amenities already described in the original
