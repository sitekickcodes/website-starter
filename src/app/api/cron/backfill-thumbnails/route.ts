import { getPayload } from "payload";
import config from "@payload-config";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getPayload({ config });
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
  const page = Number(url.searchParams.get("page")) || 1;
  const regenerateAll = url.searchParams.get("all") === "true";

  const { docs, totalPages, totalDocs } = await payload.find({
    collection: "media",
    limit,
    page,
    where: {
      and: [
        { mimeType: { like: "image/%" } },
        { mimeType: { not_equals: "image/svg+xml" } },
      ],
    },
  });

  const results: Array<{ id: number | string; filename: string; status: string; error?: string }> = [];

  for (const doc of docs) {
    const sizes = doc.sizes as Record<string, { url?: string | null }> | undefined;
    const hasThumbnail = !!sizes?.thumbnail?.url;
    const hasCard = !!sizes?.card?.url;
    const hasDesktop = !!sizes?.desktop?.url;

    if (!regenerateAll && hasThumbnail && hasCard && hasDesktop) {
      results.push({ id: doc.id, filename: doc.filename as string, status: "skipped" });
      continue;
    }

    const imageUrl = doc.url as string;
    if (!imageUrl) {
      results.push({ id: doc.id, filename: doc.filename as string, status: "skipped", error: "no URL" });
      continue;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Fetch ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      await payload.update({
        collection: "media",
        id: doc.id,
        data: {},
        file: { data: buffer, mimetype: doc.mimeType as string, name: doc.filename as string, size: buffer.length },
      });

      results.push({ id: doc.id, filename: doc.filename as string, status: "regenerated" });
    } catch (error) {
      results.push({ id: doc.id, filename: doc.filename as string, status: "error", error: error instanceof Error ? error.message : String(error) });
    }
  }

  return Response.json({
    page, totalPages, totalDocs,
    processed: results.length,
    regenerated: results.filter((r) => r.status === "regenerated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
