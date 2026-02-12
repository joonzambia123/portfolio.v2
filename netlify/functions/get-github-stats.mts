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

    // Fetch user events with pagination — up to 2 pages (200 events max)
    // Reduced from 3 pages to minimize API calls
    const allEvents: GitHubEvent[] = [];
    for (let page = 1; page <= 2; page++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const eventsRes = await fetch(
        `https://api.github.com/users/${githubUsername}/events?per_page=100&page=${page}`,
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

      const pageEvents: GitHubEvent[] = await eventsRes.json();
      if (pageEvents.length === 0) break;

      allEvents.push(...pageEvents);

      // If the oldest event on this page is before our window, no need for more pages
      const oldestOnPage = new Date(pageEvents[pageEvents.length - 1].created_at);
      if (oldestOnPage < weekStart) break;
    }

    const events = allEvents;

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
    const pushCount = pushEvents.length;
    let failedComparisons = 0;

    // Build list of valid Compare calls needed
    const compareCalls = pushEvents
      .filter((e) => {
        const b = e.payload.before;
        const h = e.payload.head;
        return b && h && b !== "0000000000000000000000000000000000000000";
      })
      .map((e) => ({
        repo: e.repo.name,
        before: e.payload.before!,
        head: e.payload.head!,
      }));

    // Limit compare calls to prevent rate limit issues
    // Only process the most recent 15 pushes (usually enough for a 2-week summary)
    const limitedCompareCalls = compareCalls.slice(0, 15);

    // Process all Compare calls in concurrent batches of 5.
    // Each call is per-push so we capture total churn (lines touched),
    // not just net diff.
    const BATCH_SIZE = 5;
    for (let i = 0; i < limitedCompareCalls.length; i += BATCH_SIZE) {
      const batch = limitedCompareCalls.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async ({ repo, before, head }) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);

          const compareRes = await fetch(
            `https://api.github.com/repos/${repo}/compare/${before}...${head}`,
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
        } else if (result.status === "rejected") {
          failedComparisons++;
        }
      }
    }

    const isPartial = limitedCompareCalls.length > 0 && failedComparisons > limitedCompareCalls.length / 2;

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
          // Cache for 1 hour, serve stale for up to 4 hours while revalidating
          // Reduces API calls significantly to avoid rate limits
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=14400",
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
