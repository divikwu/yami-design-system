function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function jsonObjects(source: string) {
  const results: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (character === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          results.push(JSON.parse(source.slice(start, index + 1)) as unknown);
        } catch {
          // Continue scanning for a later complete JSON object.
        }
        start = -1;
      }
    }
  }
  return results;
}

export function parseAgentJson(source: string) {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Agent returned an empty response.");
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (objectValue(parsed)) return parsed;
  } catch {
    // The CLI may wrap its final JSON in Markdown or status text.
  }
  const candidates = jsonObjects(trimmed);
  const parsed = candidates.at(-1);
  if (!objectValue(parsed)) {
    throw new Error("Agent response does not contain a JSON object.");
  }
  return parsed;
}

export function asObject(value: unknown) {
  return objectValue(value);
}
