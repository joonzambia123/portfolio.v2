interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    head?: string;
    before?: string;
    size?: number; // number of commits in push
  };
  repo: {
    name: string;
  };
}

interface CompareData {
  files?: Array<{
    additions: number;
    deletions: number;
  }>;
}

// Rolling 2-week window
function getWeekStart(): Date {
  const now = new Date();
  return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
}

const GITHUB_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "Portfolio-Stats",
});

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export default async function handler() {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!githubToken || !githubUsername) {
    return new Response(
      JSON.stringify({ error: "Missing config" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  try {
    const weekStart = getWeekStart();

    // Fetch user events — abort after 8 seconds to stay within Netlify limits
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const eventsRes = await fetch(
      `https://api.github.com/users/${githubUsername}/events?per_page=100`,
      {
        headers: GITHUB_HEADERS(githubToken),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!eventsRes.ok) {
      const rateLimitRemaining = eventsRes.headers.get("x-ratelimit-remaining");
      throw new Error(
        `Events API ${eventsRes.status}` +
        (rateLimitRemaining === "0" ? " (rate limited)" : "")
      );
    }

    const events: GitHubEvent[] = await eventsRes.json();

    // Filter push events within the rolling window
    const pushEvents = events.filter((e) => {
      if (e.type !== "PushEvent") return false;
      return new Date(e.created_at) >= weekStart;
    });

    // Last commit time from the most recent push event (any time)
    const allPushEvents = events.filter((e) => e.type === "PushEvent");
    const lastCommitAt = allPushEvents.length > 0 ? allPushEvents[0].created_at : null;

    let added = 0;
    let deleted = 0;
    let pushCount = 0;
    let failedComparisons = 0;

    // Cap at 15 Compare calls to avoid rate limits and timeouts
    const eventsToProcess = pushEvents.slice(0, 15);

    // Process Compare calls concurrently (max 5 at a time) for speed
    const BATCH_SIZE = 5;
    for (let i = 0; i < eventsToProcess.length; i += BATCH_SIZE) {
      const batch = eventsToProcess.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (event) => {
          const before = event.payload.before;
          const head = event.payload.head;

          if (!before || !head) return null;
          if (before === "0000000000000000000000000000000000000000") return null;

          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);

          const compareRes = await fetch(
            `https://api.github.com/repos/${event.repo.name}/compare/${before}...${head}`,
            {
              headers: GITHUB_HEADERS(githubToken),
              signal: ctrl.signal,
            }
          );
          clearTimeout(t);

          if (!compareRes.ok) return null;

          const data: CompareData = await compareRes.json();
          if (!data.files) return null;

          let a = 0, d = 0;
          for (const file of data.files) {
            a += file.additions || 0;
            d += file.deletions || 0;
          }
          return { added: a, deleted: d };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          added += result.value.added;
          deleted += result.value.deleted;
          pushCount++;
        } else if (result.status === "rejected") {
          failedComparisons++;
        }
      }
    }

    // If most comparisons failed, the data is unreliable — signal partial failure
    const totalAttempted = eventsToProcess.filter(
      (e) => e.payload.before && e.payload.head &&
             e.payload.before !== "0000000000000000000000000000000000000000"
    ).length;
    const isPartial = totalAttempted > 0 && failedComparisons > totalAttempted / 2;

    return new Response(
      JSON.stringify({
        added,
        deleted,
        weekStart: weekStart.toISOString(),
        pushCount,
        lastCommitAt,
        ...(isPartial ? { partial: true } : {}),
      }),
      {
        status: 200,
        headers: {
          ...JSON_HEADERS,
          // Cache for 30 min, serve stale for up to 6 hours while revalidating
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=21600",
        },
      }
    );
  } catch (error) {
    // Return 502 so the client knows to use cached data
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 502, headers: JSON_HEADERS }
    );
  }
}
