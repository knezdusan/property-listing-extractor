import path from "path";
import { readFile, writeFile } from "fs/promises";

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

// Helper function: Checks if a string is a valid month-year format like "June 2023"
export function isValidMonthYear(monthYearString: string) {
  const parts = monthYearString.split(" ");
  if (parts.length !== 2) {
    return false; // Incorrect format
  }

  const monthName = parts[0];
  const yearString = parts[1];
  const year = parseInt(yearString, 10);

  if (isNaN(year) || year < 1000 || year > 9999) {
    return false; // Invalid year format
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = monthNames.indexOf(monthName);

  return monthIndex !== -1; // Month name is valid
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
    console.error(`❌ ${getWhat} failed after ${MAX_RETRIES} attempts`);
    return null;
  }
  return result;
}

// Helper function: Save string content to file
export async function saveToFile(content: string, filePath: string) {
  const filePathFull = path.join(process.cwd(), filePath);
  try {
    await writeFile(filePathFull, content, "utf-8");
    console.log(`✔ Saved content to ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to save content to ${filePath}:`, error);
  }
}

// Helper function: Read string content from file
export async function readFromFile(filePath: string) {
  const filePathFull = path.join(process.cwd(), filePath);
  try {
    const content = await readFile(filePathFull, "utf-8");
    console.log(`✔ Read content from ${filePath}`);
    return content;
  } catch (error) {
    console.error(`❌ Failed to read content from ${filePath}:`, error);
    return null;
  }
}

// Check data structure type (object, array, primitive or null)
export function checkStructureType(structure: unknown): string | null {
  // Check if the structure is empty
  if (!structure) {
    return null;
  }

  // Check if the structure is an object
  if (typeof structure === "object") {
    return "object";
  }

  // Check if the structure is an array
  if (Array.isArray(structure)) {
    return "array";
  }

  // If structure is a primitive
  return "primitive";
}

/**
 * Checks if a value is a plain JavaScript object (excluding arrays and null).
 * Uses a type predicate for type narrowing.
 * @param value The value to check.
 * @returns `true` if the value is a non-null object and not an array, `false` otherwise.
 *          If true, TypeScript knows `value` is a `Record<keyof string, unknown>` within the conditional block.
 */
export function isObject(value: unknown): value is Record<keyof string, unknown> {
  // 1. Check if it's an object type
  // 2. Ensure it's not null (typeof null === 'object')
  // 3. Ensure it's not an array (arrays are objects too)
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is an array.
 * Uses a type predicate for type narrowing.
 * @param value The value to check.
 * @returns `true` if the value is an array, `false` otherwise.
 *          If true, TypeScript knows `value` is `unknown[]` within the conditional block.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Finds the value of the first property matching the given name in a deeply nested structure
 * using an iterative Breadth-First Search (BFS) approach. Handles circular references.
 *
 * @param obj The complex object to search within.
 * @param propName The name of the property to find.
 * @returns The value of the found property (can be primitive, object, or array),
 *          or `null` if the property is not found. The return type is `unknown`
 *          as the value's type isn't known at compile time.
 */
export function getNestedValue(obj: Record<string, unknown>, propName: string): unknown {
  // Base case: If obj is not a searchable object/array, return null.
  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  // Queue holds items (objects/arrays) to explore. 'unknown' is used as elements can be anything.
  const queue: unknown[] = [obj];
  // Visited tracks object references to prevent infinite loops in circular structures.
  // We only add non-null objects to this set.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item. It's 'unknown' until we inspect it.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited in this path.
    // Need the type check again because the queue holds 'unknown'.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // At this point, TypeScript knows `current` is a non-null `object`.
    // We add it to visited.
    visited.add(current);

    // 1. Check if the property exists directly on the current object/array.
    //    Use Object.prototype.hasOwnProperty.call for safety.
    if (Object.prototype.hasOwnProperty.call(current, propName)) {
      // Property found! Return its value.
      // We need to assert the type of `current` to allow indexing.
      // Using a Record with string keys is more specific than 'keyof any'
      return (current as Record<string, unknown>)[propName];
    }

    // 2. Add nested objects/arrays to the queue for later exploration.
    //    Iterate over keys for objects or indices (as strings) for arrays.
    //    `key` is `string` in a for...in loop.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // Access the value. Need type assertion again to index `current`.
        const value = (current as Record<string, unknown>)[key];

        // Only queue actual objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          // --- Type Assertion Point ---
          // Here, TypeScript knows `value` is a non-null `object`.
          // Optimization: Check visited *before* pushing to potentially avoid growing the queue unnecessarily.
          if (!visited.has(value)) {
            queue.push(value); // Add nested structures to the end of the queue
          }
        }
      }
    }
  }

  // 3. If the queue is empty and the property wasn't found anywhere.
  return null;
}

/**
 * Finds and removes the first occurrence of a property with the given name
 * in a deeply nested structure using an iterative Breadth-First Search (BFS) approach.
 * Modifies the original object/array in place. Handles circular references.
 * @param obj The complex object or array to search within and modify. Can be any structure.
 * @param propName The name of the property to find and remove.
 * @returns `true` if the property was found and removed, `false` otherwise.
 */
export function removeNestedValue(obj: unknown, propName: string): boolean {
  // Base case: If obj is not a searchable/modifiable object/array, do nothing.
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Queue holds items (objects/arrays) to explore.
  const queue: unknown[] = [obj];
  // Visited tracks object references to prevent infinite loops in circular structures.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // `current` is a non-null `object`.
    visited.add(current);

    // Iterate through the keys/indices of the current object/array.
    // `key` will be a string, even for array indices.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // --- Check if the CURRENT key is the one to remove ---
        if (key === propName) {
          // Found the property on the 'current' object/array. Now remove it.
          if (Array.isArray(current)) {
            // Use splice for arrays. Need to convert string key to number.
            const index = parseInt(key, 10);
            // Ensure it's a valid number index before splicing
            if (!isNaN(index) && index >= 0 && index < current.length) {
              current.splice(index, 1);
              return true; // Property found and removed
            } else {
              // This case is unlikely if hasOwnProperty passed for a standard array,
              // but handle defensively. Maybe it's a non-index property on an array?
              // Treat as object deletion.
              delete (current as unknown as Record<string, unknown>)[key]; // Less ideal for arrays, but covers edge cases
              return true;
            }
          } else {
            // Use delete for objects.
            // Type assertion needed to satisfy TypeScript's index signature rules.
            delete (current as Record<string, unknown>)[key];
            return true; // Property found and removed
          }
        }

        // --- If not the target key, check the VALUE for queueing ---
        // Access the value associated with the key. Assertion needed.
        const value = (current as Record<string, unknown>)[key];

        // Only queue nested objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          // --- Type Assertion Point ---
          // `value` is a non-null `object`.
          // Add to queue only if not already visited.
          if (!visited.has(value)) {
            queue.push(value);
          }
        }
      }
    }
  }

  // 3. If the queue is empty and the property wasn't found anywhere.
  return false;
}

/**
 * Finds the first nested object (of object array) with specific key (`targetKeyName`), eg "section"
 * where that object has a specific property (`checkPropName`) matching a given value (`checkPropValue`), eg "__typename": "someValue".
 * Uses an iterative Breadth-First Search (BFS) and handles circular references.
 *
 * @param objToSearch The complex object or array (like apiData) to search within.
 * @param targetKeyName The name of the key whose value is the potential target object (e.g., "section").
 * @param checkPropName The name of the property within the target object to check (e.g., "__typename").
 * @param checkPropValue The value that the `checkPropName` property must match.
 * @returns The first matching target object found, or `null` if no match is found.
 *          The return type is `Record<string, unknown> | null`.
 */
export function findNestedObjectByPropValue(
  objToSearch: unknown,
  targetKeyName: string,
  checkPropName: string,
  checkPropValue: string
): Record<string, unknown> | null {
  // Base case: If obj is not a searchable object/array, return null.
  if (typeof objToSearch !== "object" || objToSearch === null) {
    return null;
  }

  // Queue holds items (objects/arrays) to explore.
  const queue: unknown[] = [objToSearch];
  // Visited tracks object references to prevent infinite loops in circular structures.
  const visited = new Set<object>();

  while (queue.length > 0) {
    // Dequeue the next item.
    const current = queue.shift();

    // Skip primitives, null, or objects/arrays already visited.
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    // --- Type Assertion Point ---
    // `current` is a non-null `object`.
    visited.add(current);

    // Iterate through the keys/indices of the current object/array.
    for (const key in current) {
      // Ensure we only process own properties.
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // --- Core Logic: Check if this key matches targetKeyName ---
        if (key === targetKeyName) {
          const potentialTarget = (current as Record<string, unknown>)[key];

          // --- Check if the value is an object and has the target property/value ---
          if (
            typeof potentialTarget === "object" && // Is it an object?
            potentialTarget !== null && // Is it not null?
            Object.prototype.hasOwnProperty.call(potentialTarget, checkPropName) && // Does it have the check property?
            (potentialTarget as Record<string, unknown>)[checkPropName] === checkPropValue // Does the value match?
          ) {
            // Found it! Return the target object itself.
            return potentialTarget as Record<string, unknown>;
          }
        }

        // --- Queueing Logic: If the current *value* is an object/array, queue it ---
        // Access the value associated with the key. Assertion needed.
        const value = (current as Record<string, unknown>)[key];

        // Only queue nested non-null objects or arrays for further searching.
        if (typeof value === "object" && value !== null) {
          if (!visited.has(value)) {
            // Check visited before push (minor optimization)
            queue.push(value);
          }
        }
      }
    }
  }

  // If the queue is empty and the target object wasn't found.
  return null;
}
