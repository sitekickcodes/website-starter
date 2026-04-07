import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

/**
 * Infer alt text from a filename for files that Claude can't process (e.g. SVGs).
 * "duckworth_horizontal_white.svg" → "Duckworth logo"
 * "trust-for-public-land-logo-white.svg" → "Trust for Public Land logo"
 * "hero-banner.jpg" → "Hero banner"
 */
export function altTextFromFilename(filename: string): string | null {
  if (!filename) return null;

  // Remove extension
  const name = filename.replace(/\.[^.]+$/, "");

  // Split on hyphens, underscores, and camelCase boundaries
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  // Remove noise words common in filenames
  const noise = new Set(["img", "imgi", "image", "horizontal", "vertical", "white", "black", "dark", "light", "color", "full", "final", "v2", "v3", "copy"]);
  const cleaned = words.filter((w) => !noise.has(w) && !/^\d+$/.test(w));

  if (cleaned.length === 0) return null;

  // Check if it looks like a logo
  const isLogo =
    filename.toLowerCase().endsWith(".svg") ||
    words.some((w) => w === "logo" || w === "icon" || w === "mark");

  // Capitalize first letter of each word
  const titleCase = cleaned
    .filter((w) => w !== "logo" && w !== "icon" && w !== "mark")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return isLogo ? `${titleCase} logo` : titleCase;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SUPPORTED_TYPES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function generateAltText(imageUrl: string, filename?: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    // Detect unsupported formats that need conversion
    const ext = imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || "";
    const UNSUPPORTED_EXTS = new Set(["avif", "tiff", "tif", "heic", "heif"]);
    const isLocal = imageUrl.includes("localhost") || imageUrl.includes("127.0.0.1");
    const needsConversion = UNSUPPORTED_EXTS.has(ext);

    let imageSource: Anthropic.ImageBlockParam["source"];

    if (isLocal || needsConversion) {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        console.warn("[generateAltText] Failed to fetch image:", res.status);
        return null;
      }
      const rawBuffer = Buffer.from(await res.arrayBuffer());

      let finalBuffer: Buffer;
      let mediaType: ImageMediaType;

      if (needsConversion) {
        // Convert unsupported formats to PNG (preserves transparency)
        finalBuffer = await sharp(rawBuffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .png()
          .toBuffer();
        mediaType = "image/png";
      } else {
        const contentType = res.headers.get("content-type") || "image/png";
        if (!SUPPORTED_TYPES.has(contentType)) {
          console.warn("[generateAltText] Unsupported image type:", contentType);
          return null;
        }
        finalBuffer = rawBuffer;
        mediaType = contentType as ImageMediaType;
      }

      imageSource = {
        type: "base64",
        media_type: mediaType,
        data: finalBuffer.toString("base64"),
      };
    } else {
      imageSource = { type: "url", url: imageUrl };
    }

    const filenameHint = filename
      ? ` The filename is "${filename}" — use any names, places, or context from it.`
      : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: imageSource },
            {
              type: "text",
              text: `Write alt text for this image in under 12 words. Use names if known. No filler words like "image of" or "photo of".${filenameHint}`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || !("text" in textBlock)) return null;

    return textBlock.text
      .replace(/^#+\s*(alt\s*text\s*:?\s*)?/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();
  } catch (error) {
    console.warn("[generateAltText] Failed to generate alt text:", error);
    return null;
  }
}
