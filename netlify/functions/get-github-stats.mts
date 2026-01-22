interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    head?: string;
    before?: string;
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

// Get Monday of current week (UTC)
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - diff);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

export default async function handler() {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!githubToken || !githubUsername) {
    return new Response(
      JSON.stringify({ added: 0, deleted: 0, error: "Missing config" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const weekStart = getWeekStart();

    // Fetch user's events
    const eventsRes = await fetch(
      `https://api.github.com/users/${githubUsername}/events?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Portfolio-Stats",
        },
      }
    );

    if (!eventsRes.ok) {
      throw new Error(`Events API: ${eventsRes.status}`);
    }

    const events: GitHubEvent[] = await eventsRes.json();

    // Filter push events from this week
    const pushEvents = events.filter((e) => {
      if (e.type !== "PushEvent") return false;
      return new Date(e.created_at) >= weekStart;
    });

    let added = 0;
    let deleted = 0;
    let pushCount = 0;

    // Use Compare API to get stats for each push
    for (const event of pushEvents) {
      const before = event.payload.before;
      const head = event.payload.head;

      if (!before || !head) continue;

      // Skip if before is all zeros (first commit)
      if (before === "0000000000000000000000000000000000000000") continue;

      try {
        const compareRes = await fetch(
          `https://api.github.com/repos/${event.repo.name}/compare/${before}...${head}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "Portfolio-Stats",
            },
          }
        );

        if (compareRes.ok) {
          const data: CompareData = await compareRes.json();
          if (data.files) {
            for (const file of data.files) {
              added += file.additions || 0;
              deleted += file.deletions || 0;
            }
            pushCount++;
          }
        }
      } catch {
        // Skip failed comparisons
      }
    }

    return new Response(
      JSON.stringify({
        added,
        deleted,
        weekStart: weekStart.toISOString(),
        pushCount
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600"
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ added: 0, deleted: 0, error: String(error) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
