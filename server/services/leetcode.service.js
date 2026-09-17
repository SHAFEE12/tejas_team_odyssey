const https = require('https');

/**
 * leetcode.service.js
 *
 * Dedicated service for retrieving public LeetCode profile data and problem statistics
 * via LeetCode's public GraphQL endpoint.
 *
 * SECURITY & PRIVACY:
 *  - Only public profile information is accessed.
 *  - No passwords, cookies, session tokens, or private credentials are used.
 *  - Sanitizes and bounds all numeric fields (finite, >= 0).
 */

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

function sanitizeNumber(val, min = 0, max = 10000000) {
  const n = Number(val);
  if (isNaN(n) || !isFinite(n) || n < min) return null;
  return Math.min(n, max);
}

/**
 * Query public LeetCode GraphQL API
 */
function fetchLeetCodeGraphQL(query, variables, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });

    const req = https.request(
      LEETCODE_GRAPHQL_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://leetcode.com',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let rawData = '';

        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 429) {
            return reject(new Error('LEETCODE_RATE_LIMITED'));
          }

          if (res.statusCode >= 500) {
            return reject(new Error('LEETCODE_SERVICE_UNAVAILABLE'));
          }

          try {
            const parsed = JSON.parse(rawData);
            resolve(parsed);
          } catch {
            reject(new Error('LEETCODE_MALFORMED_RESPONSE'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('LEETCODE_TIMEOUT'));
    });

    req.on('error', (err) => {
      reject(new Error(err.message || 'LEETCODE_NETWORK_ERROR'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Fetch and normalize public LeetCode profile
 *
 * @param {string} rawUsername - The LeetCode username to look up
 * @returns {Promise<Object|null>} Normalized LeetCode profile or null if not found
 */
async function fetchLeetCodeProfile(rawUsername) {
  if (!rawUsername || typeof rawUsername !== 'string') {
    throw new Error('Invalid username provided.');
  }

  const username = rawUsername.trim();
  // LeetCode usernames: alphanumeric, underscore, dash, length 1-50
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username)) {
    throw new Error('Username contains invalid characters. Use letters, numbers, underscores, or hyphens.');
  }

  const graphqlQuery = `
    query getUserProfile($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        username
        profile {
          realName
          ranking
          userAvatar
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        totalParticipants
        topPercentage
      }
    }
  `;

  const response = await fetchLeetCodeGraphQL(graphqlQuery, { username });

  if (response.errors && response.errors.length > 0) {
    const isNotFound = response.errors.some((e) =>
      e.message && e.message.toLowerCase().includes('user does not exist')
    );
    if (isNotFound) return null;
  }

  const matchedUser = response.data?.matchedUser;
  if (!matchedUser) {
    return null;
  }

  // Parse problem submission numbers
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  let totalSolved = 0;

  const acList = matchedUser.submitStats?.acSubmissionNum || [];
  acList.forEach((item) => {
    const diff = (item.difficulty || '').toLowerCase();
    const count = sanitizeNumber(item.count, 0, 10000) || 0;

    if (diff === 'all') totalSolved = count;
    else if (diff === 'easy') easySolved = count;
    else if (diff === 'medium') mediumSolved = count;
    else if (diff === 'hard') hardSolved = count;
  });

  // If total wasn't explicitly found in 'All', compute sum
  if (totalSolved === 0 && (easySolved > 0 || mediumSolved > 0 || hardSolved > 0)) {
    totalSolved = easySolved + mediumSolved + hardSolved;
  }

  // Contest metrics
  const contestRankingData = response.data?.userContestRanking;
  const contestRating = contestRankingData?.rating
    ? Math.round(Number(contestRankingData.rating))
    : null;
  const contestRanking = contestRankingData?.globalRanking
    ? sanitizeNumber(contestRankingData.globalRanking, 1, 10000000)
    : null;

  // Acceptance rate calculation
  let acceptanceRate = null;
  const totalSubmissions = matchedUser.submitStats?.totalSubmissionNum?.find(
    (s) => (s.difficulty || '').toLowerCase() === 'all'
  )?.submissions;
  const totalAcSubmissions = matchedUser.submitStats?.acSubmissionNum?.find(
    (s) => (s.difficulty || '').toLowerCase() === 'all'
  )?.submissions;

  if (totalSubmissions && totalAcSubmissions && totalSubmissions > 0) {
    acceptanceRate = Math.round((totalAcSubmissions / totalSubmissions) * 1000) / 10; // e.g. 54.2%
  }

  const canonicalUsername = matchedUser.username || username;

  return {
    username: canonicalUsername,
    profileUrl: `https://leetcode.com/u/${encodeURIComponent(canonicalUsername)}/`,
    realName: matchedUser.profile?.realName || null,
    avatarUrl: matchedUser.profile?.userAvatar || null,
    ranking: sanitizeNumber(matchedUser.profile?.ranking, 1, 10000000),
    reputation: sanitizeNumber(matchedUser.profile?.reputation, 0, 1000000),
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    acceptanceRate,
    contestRating,
    contestRanking,
    totalParticipants: contestRankingData?.totalParticipants || null,
    topPercentage: contestRankingData?.topPercentage
      ? Math.round(Number(contestRankingData.topPercentage) * 10) / 10
      : null,
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  fetchLeetCodeProfile,
};
