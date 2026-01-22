import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

interface GitHubPushEvent {
  id: string;
  type: string;
  created_at: string;
  payload: {
    commits?: Array<{
      sha: string;
      url: string;
    }>;
  };
  repo: {
    name: string;
  };
}

interface CommitStats {
  stats: {
    additions: number;
    deletions: number;
  };
}

interface StoredStats {
  weekStart: string;
  weekEnd: string;
  linesAdded: number;
  linesDeleted: number;
  commitCount: number;
  lastUpdated: string;
  processedCommits: string[];
}

// Get the Monday of the current week (UTC)
function getWeekBoundaries(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - diff);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

export default async function handler() {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!githubToken || !githubUsername) {
    console.error("Missing GITHUB_TOKEN or GITHUB_USERNAME environment variables");
    return new Response("Missing configuration", { status: 500 });
  }

  const store = getStore("github-stats");
  const { weekStart, weekEnd } = getWeekBoundaries();

  // Get existing stats or initialize new week
  let stats: StoredStats;
  try {
    const existing = await store.get("current-stats", { type: "json" }) as StoredStats | null;

    if (existing && existing.weekStart === weekStart.toISOString()) {
      stats = existing;
    } else {
      // New week - reset stats
      stats = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        linesAdded: 0,
        linesDeleted: 0,
        commitCount: 0,
        lastUpdated: new Date().toISOString(),
        processedCommits: [],
      };
    }
  } catch {
    // Initialize fresh stats
    stats = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      linesAdded: 0,
      linesDeleted: 0,
      commitCount: 0,
      lastUpdated: new Date().toISOString(),
      processedCommits: [],
    };
  }

  try {
    // Fetch user's push events
    const eventsResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/events?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Portfolio-Stats-Fetcher",
        },
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`GitHub API error: ${eventsResponse.status}`);
    }

    const events: GitHubPushEvent[] = await eventsResponse.json();

    // Filter for push events within current week
    const pushEvents = events.filter((event) => {
      if (event.type !== "PushEvent") return false;
      const eventDate = new Date(event.created_at);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // Process each push event
    for (const event of pushEvents) {
      const commits = event.payload.commits || [];

      for (const commit of commits) {
        // Skip if already processed
        if (stats.processedCommits.includes(commit.sha)) {
          continue;
        }

        // Fetch commit details for stats
        const repoName = event.repo.name;
        const commitResponse = await fetch(
          `https://api.github.com/repos/${repoName}/commits/${commit.sha}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "Portfolio-Stats-Fetcher",
            },
          }
        );

        if (commitResponse.ok) {
          const commitData: CommitStats = await commitResponse.json();
          stats.linesAdded += commitData.stats?.additions || 0;
          stats.linesDeleted += commitData.stats?.deletions || 0;
          stats.commitCount += 1;
          stats.processedCommits.push(commit.sha);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    stats.lastUpdated = new Date().toISOString();

    // Store updated stats
    await store.setJSON("current-stats", stats);

    console.log(`Updated stats: +${stats.linesAdded} -${stats.linesDeleted} (${stats.commitCount} commits)`);

    return new Response(JSON.stringify({ success: true, stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Run every 4 hours
export const config: Config = {
  schedule: "0 */4 * * *",
};
