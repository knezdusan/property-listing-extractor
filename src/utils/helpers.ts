// Helper function: Random delay to mimic human behavior
export const randomDelay = (min = 500, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Helper function: Shuffles an array randomly
export function shuffleArray<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }

  return shuffled;
}

// Helper function getWithRetry
export async function getWithRetry<T>(getFunction: () => Promise<T>, MAX_RETRIES = 3, getWhat: string) {
  let result = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`➜ ${getWhat} - (attempt ${attempt}/${MAX_RETRIES})...`);
    result = await getFunction();

    if (result) {
      console.log(`✔ ${getWhat} succesfull - on attempt ${attempt}`);
      break;
    }

    if (attempt < MAX_RETRIES) {
      // Wait with increasing backoff between retries (1s, 2s, 4s...)
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏱️ Waiting ${delayMs}ms before retry ${attempt + 1}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (!result) {
    console.error(`✘ ${getWhat} failed after ${MAX_RETRIES} attempts`);
    return null;
  }
  return result;
}
