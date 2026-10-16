import Anthropic from "@anthropic-ai/sdk";

// Server-side only: ANTHROPIC_API_KEY must never reach the browser bundle.
// Env vars are read lazily (not at import time) because backend/index.js loads
// .env.local with dotenv after its imports have been evaluated.
const DEFAULT_MODEL = "claude-haiku-5-5";

// Claude accepts only these image types; 5 MB per image on the API.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not defined");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function sniffImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer.length >= 4 && buffer.toString("latin1", 0, 4) === "GIF8") return "image/gif";
  if (buffer.length >= 12 && buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Turns a data: URL or http(s) URL into a Claude base64 image content block.
 * The media type is detected from the bytes, so it is correct even when the
 * URL or declared MIME type is wrong. Throws if the photo cannot be used.
 */
export async function toImageBlock(url) {
  let buffer;
  if (url.startsWith("data:")) {
    const matches = url.match(/^data:[^;,]*;base64,(.+)$/s);
    if (!matches) throw new Error("Photo is not a valid base64 data URL");
    buffer = Buffer.from(matches[1], "base64");
  } else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download photo (HTTP ${response.status})`);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  const mediaType = sniffImageType(buffer);
  if (!mediaType) throw new Error("Photo must be a JPEG, PNG, GIF or WebP image");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Photo is larger than 5 MB");

  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
  };
}

/**
 * Parses a model reply as JSON. Structured outputs already guarantee valid
 * JSON, but this also tolerates code fences or stray prose around the object.
 */
export function parseJsonReply(text) {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to the original error
      }
    }
    throw firstError;
  }
}

/**
 * Sends a prompt (plus an optional photo) to Claude and returns the parsed JSON
 * object. `schema` is a JSON Schema (additionalProperties: false on every
 * object) that the API enforces, so the UI always receives the expected keys.
 */
export async function generateJson({ prompt, schema, image = null, maxTokens = 8000, effort = "low" }) {
  const content = [];
  if (image) content.push(image); // images before text
  content.push({ type: "text", text: prompt });

  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens,
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to analyze this photo");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The AI response was cut off before it finished");
  }

  // Thinking blocks may come first, so find the text block by type.
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) throw new Error("The AI returned no text");

  return parseJsonReply(textBlock.text);
}
