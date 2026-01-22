import { getStore } from "@netlify/blobs";

interface StoredStats {
  weekStart: string;
  weekEnd: string;
  linesAdded: number;
  linesDeleted: number;
  commitCount: number;
  lastUpdated: string;
  processedCommits: string[];
}

export default async function handler() {
  const store = getStore("github-stats");

  try {
    const stats = await store.get("current-stats", { type: "json" }) as StoredStats | null;

    if (!stats) {
      // Return defaults if no data yet
      return new Response(
        JSON.stringify({
          added: 0,
          deleted: 0,
          commitCount: 0,
          weekStart: null,
          lastUpdated: null,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        added: stats.linesAdded,
        deleted: stats.linesDeleted,
        commitCount: stats.commitCount,
        weekStart: stats.weekStart,
        lastUpdated: stats.lastUpdated,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error reading GitHub stats:", error);
    return new Response(
      JSON.stringify({
        added: 0,
        deleted: 0,
        commitCount: 0,
        weekStart: null,
        lastUpdated: null,
        error: "Failed to read stats",
      }),
      {
        status: 200, // Return 200 with defaults so UI doesn't break
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60", // Short cache on error
        },
      }
    );
  }
}
