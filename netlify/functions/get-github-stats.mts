interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection: {
        totalCommitContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          weeks: ContributionWeek[];
        };
        commitContributionsByRepository: Array<{
          repository: {
            nameWithOwner: string;
            isPrivate: boolean;
          };
          contributions: {
            totalCount: number;
            nodes: Array<{
              occurredAt: string;
              commitCount: number;
            }>;
          };
        }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface RepoCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
  };
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
      JSON.stringify({ added: 0, deleted: 0, commits: 0, error: "Missing config" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const weekStart = getWeekStart();
    const now = new Date();

    // Use GraphQL API to get contribution data (includes private contributions)
    const graphqlQuery = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            restrictedContributionsCount
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
                isPrivate
              }
              contributions(first: 100) {
                totalCount
                nodes {
                  occurredAt
                  commitCount
                }
              }
            }
          }
        }
      }
    `;

    const graphqlRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Portfolio-Stats",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          username: githubUsername,
          from: weekStart.toISOString(),
          to: now.toISOString(),
        },
      }),
    });

    if (!graphqlRes.ok) {
      throw new Error(`GraphQL API: ${graphqlRes.status}`);
    }

    const graphqlData: GraphQLResponse = await graphqlRes.json();

    if (graphqlData.errors) {
      throw new Error(graphqlData.errors[0].message);
    }

    const contributionsCollection = graphqlData.data?.user?.contributionsCollection;

    if (!contributionsCollection) {
      throw new Error("No contribution data found");
    }

    // Total commits this week (includes private)
    const totalCommits = contributionsCollection.totalCommitContributions;
    const privateCommits = contributionsCollection.restrictedContributionsCount;

    // Get repos contributed to this week
    const reposContributed = contributionsCollection.commitContributionsByRepository;

    let added = 0;
    let deleted = 0;
    let lastCommitAt: string | null = null;

    // For each repo, fetch commit stats using REST API
    for (const repoContrib of reposContributed) {
      const repoName = repoContrib.repository.nameWithOwner;

      // Get the most recent contribution date for lastCommitAt
      for (const node of repoContrib.contributions.nodes) {
        if (!lastCommitAt || node.occurredAt > lastCommitAt) {
          lastCommitAt = node.occurredAt;
        }
      }

      // Fetch commits from this repo for this week to get line stats
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${repoName}/commits?since=${weekStart.toISOString()}&author=${githubUsername}&per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "Portfolio-Stats",
            },
          }
        );

        if (commitsRes.ok) {
          const commits: RepoCommit[] = await commitsRes.json();

          // Fetch stats for each commit
          for (const commit of commits) {
            try {
              const commitDetailRes = await fetch(
                `https://api.github.com/repos/${repoName}/commits/${commit.sha}`,
                {
                  headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github+json",
                    "User-Agent": "Portfolio-Stats",
                  },
                }
              );

              if (commitDetailRes.ok) {
                const commitDetail: RepoCommit = await commitDetailRes.json();
                if (commitDetail.stats) {
                  added += commitDetail.stats.additions || 0;
                  deleted += commitDetail.stats.deletions || 0;
                }
              }
            } catch {
              // Skip failed commit fetches
            }
          }
        }
      } catch {
        // Skip repos we can't access
      }
    }

    return new Response(
      JSON.stringify({
        added,
        deleted,
        commits: totalCommits,
        privateCommits,
        weekStart: weekStart.toISOString(),
        repoCount: reposContributed.length,
        lastCommitAt,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ added: 0, deleted: 0, commits: 0, error: String(error) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
