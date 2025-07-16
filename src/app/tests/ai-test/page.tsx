// Documentation Vercel: https://ai-sdk.js.org/docs/ai-sdk-openai
// Documentation Vercel: https://ai-sdk.dev/docs/guides/openai-responses
// Documentation OpenAI: https://platform.openai.com/docs/guides/text?api-mode=responses

import { generateAiText } from "@/utils/ai";

const title = "Apartment in a new house";
const description = `Forget your worries in this spacious, private space.

a separate new 1kk apartment in a quiet area of Prague 4, Budějovická metro. There is also a bus stop Hadovitá nearby.

The apartment has everything basic and necessary for a long and short stay of one or two guests.

I can send a video of the apartment to telegram @apart7prague
The space
This is a separate place, you will be in it yourself`;

const prompt = `You are a creative copywriter tasked with generating a one-sentence introductory text for a property listing website's header section, based on the provided title and description. The intro text must:
- Be a single, concise sentence (15-25 words).
- Be affirmative and engaging, acting as a teaser to encourage visitors to stay on the page.
- Avoid using personal names, brand names, or specific details (e.g., locations, metro stations, or contact information) from the title or description to prevent repetition.
- Be original, focusing on the general appeal or vibe of the property (e.g., comfort, relaxation, or suitability for guests) without repeating specific details like "spacious," "private," "quiet area," or "basic necessities" from the description.
- Highlight the property’s inviting nature for a short or long stay.

Input:
Title: ${title}
Description: ${description}

Output a single sentence that meets these criteria.`;

const introText = await generateAiText(prompt);

export default function AiTestPage() {
  return (
    <div>
      <h1>AI Test</h1>
      <p>{introText}</p>
    </div>
  );
}
