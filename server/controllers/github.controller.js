const https = require('https');
const GitHubProfile = require('../models/GitHubProfile');

/* ──────────────────────────────────────────────────────────────
   Utility: fetch a GitHub API URL with basic error classification.
   Returns parsed JSON on success.
   Throws an object { status, message } on failure.
────────────────────────────────────────────────────────────── */
function fetchGitHub(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'CareerOdyssey-App/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch { parsed = {}; }

        if (res.statusCode === 200) {
          return resolve(parsed);
        }

        if (res.statusCode === 404) {
          return reject({ status: 404, message: 'GitHub account not found. Check the username and try again.' });
        }

        if (res.statusCode === 403 || res.statusCode === 429) {
          return reject({ status: 429, message: 'GitHub rate limit reached. Please try again in a few minutes.' });
        }

        if (res.statusCode === 422) {
          return reject({ status: 422, message: 'Invalid GitHub username.' });
        }

        return reject({ status: res.statusCode, message: `GitHub API error (${res.statusCode}).` });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ status: 504, message: 'GitHub API request timed out. Please try again.' });
    });

    req.on('error', (err) => {
      reject({ status: 503, message: 'Unable to reach GitHub. Check your network and try again.' });
    });

    req.end();
  });
}

/* ──────────────────────────────────────────────────────────────
   Validate GitHub username (letters, numbers, hyphens; no leading/trailing dash)
────────────────────────────────────────────────────────────── */
function isValidGitHubUsername(username) {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username);
}

/* ──────────────────────────────────────────────────────────────
   Normalize repos: top-6 by stars (own repos preferred), pick fields
────────────────────────────────────────────────────────────── */
function normalizeRepos(rawRepos) {
  const sorted = rawRepos
    .slice()
    .sort((a, b) => b.stargazers_count - a.stargazers_count);
  return sorted.slice(0, 6).map((r) => ({
    id:          r.id,
    name:        r.name,
    fullName:    r.full_name,
    description: r.description || '',
    htmlUrl:     r.html_url,
    language:    r.language || null,
    stargazers:  r.stargazers_count || 0,
    forks:       r.forks_count || 0,
    isForked:    r.fork || false,
    updatedAt:   r.updated_at ? new Date(r.updated_at) : null,
  }));
}

/* ──────────────────────────────────────────────────────────────
   Compute top-5 languages from all repos by occurrence count
────────────────────────────────────────────────────────────── */
function computeLanguages(rawRepos) {
  const counts = {};
  for (const r of rawRepos) {
    if (r.language) {
      counts[r.language] = (counts[r.language] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);
}

/* ══════════════════════════════════════════════════════════════
   GET /api/github
   Returns current student's GitHub profile (cached or empty).
══════════════════════════════════════════════════════════════ */
const getGitHubProfile = async (req, res) => {
  try {
    const profile = await GitHubProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'GitHub profile not found.' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('getGitHubProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching GitHub profile.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUT /api/github
   Save / update the student's GitHub username (without syncing).
   Used to set the username before the first sync.
══════════════════════════════════════════════════════════════ */
const saveGitHubUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const cleaned = username.trim();

    if (!cleaned) {
      return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
    }

    if (!isValidGitHubUsername(cleaned)) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub username format.' });
    }

    const profile = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { username: cleaned, connected: false, lastSyncError: null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'GitHub username saved. Run a sync to fetch your data.',
      profile,
    });
  } catch (err) {
    console.error('saveGitHubUsername error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error saving GitHub username.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   POST /api/github/sync
   Fetches REAL data from GitHub API and stores it.
   Requires the student to have saved a username first.
   Returns the updated profile on success.
══════════════════════════════════════════════════════════════ */
const syncGitHub = async (req, res) => {
  try {
    // Get existing record
    let profile = await GitHubProfile.findOne({ user: req.user._id });

    if (!profile || !profile.username) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub username saved. Add your username first.',
      });
    }

    const username = profile.username;

    // Validate again (defensive)
    if (!isValidGitHubUsername(username)) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub username on record.' });
    }

    // Fetch from GitHub API
    let ghUser, ghRepos;

    try {
      ghUser = await fetchGitHub(`/users/${username}`);
    } catch (ghErr) {
      // Save error to profile and return it
      await GitHubProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: { connected: false, lastSyncError: ghErr.message } }
      );
      return res.status(ghErr.status || 502).json({
        success: false,
        message: ghErr.message || 'GitHub sync failed.',
      });
    }

    try {
      // Fetch up to 100 repos sorted by updated desc
      ghRepos = await fetchGitHub(`/users/${username}/repos?per_page=100&sort=updated&direction=desc&type=owner`);
    } catch {
      // Repos are optional — use empty array if unavailable
      ghRepos = [];
    }

    // Ensure ghRepos is an array (GitHub may return object on error)
    if (!Array.isArray(ghRepos)) ghRepos = [];

    // Compute aggregates
    const totalStars = ghRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const totalForks = ghRepos.reduce((s, r) => s + (r.forks_count || 0), 0);
    const languages  = computeLanguages(ghRepos);
    const repos      = normalizeRepos(ghRepos);

    const update = {
      username,
      connected:   true,
      name:        ghUser.name        || '',
      bio:         ghUser.bio         || '',
      avatarUrl:   ghUser.avatar_url  || '',
      profileUrl:  ghUser.html_url    || `https://github.com/${username}`,
      publicRepos: ghUser.public_repos || 0,
      followers:   ghUser.followers   || 0,
      following:   ghUser.following   || 0,
      publicGists: ghUser.public_gists|| 0,
      company:     ghUser.company     || '',
      location:    ghUser.location    || '',
      blog:        ghUser.blog        || '',
      createdAt:   ghUser.created_at  ? new Date(ghUser.created_at) : null,
      totalStars,
      totalForks,
      languages,
      repositories: repos,
      lastSyncedAt: new Date(),
      lastSyncError: null,
    };

    const updated = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'GitHub data synced successfully.',
      profile: updated,
    });
  } catch (err) {
    console.error('syncGitHub error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during GitHub sync.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   DELETE /api/github/disconnect
   Removes stored GitHub data for the student.
══════════════════════════════════════════════════════════════ */
const disconnectGitHub = async (req, res) => {
  try {
    await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          username: '', connected: false,
          name: '', bio: '', avatarUrl: '', profileUrl: '',
          publicRepos: 0, followers: 0, following: 0, publicGists: 0,
          totalStars: 0, totalForks: 0, languages: [], repositories: [],
          lastSyncedAt: null, lastSyncError: null,
        },
      },
      { upsert: false }
    );
    return res.status(200).json({ success: true, message: 'GitHub account disconnected.' });
  } catch (err) {
    console.error('disconnectGitHub error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error disconnecting GitHub.' });
  }
};

module.exports = {
  getGitHubProfile,
  saveGitHubUsername,
  syncGitHub,
  disconnectGitHub,
};
