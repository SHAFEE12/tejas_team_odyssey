const mongoose = require('mongoose');

/**
 * GitHubProfile — stores a student's connected GitHub data.
 *
 * INTEGRATION STATUS: REAL GitHub API data.
 * The backend fetches from https://api.github.com using Node's
 * built-in https module (no extra packages needed).
 *
 * Data is fetched on POST /api/github/sync and cached here.
 * lastSyncedAt tracks when data was last refreshed.
 *
 * Only public GitHub data is stored (no OAuth, no private repos).
 */

const repoSchema = new mongoose.Schema(
  {
    id:          { type: Number },
    name:        { type: String, trim: true },
    fullName:    { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    htmlUrl:     { type: String, trim: true },
    language:    { type: String, trim: true, default: null },
    stargazers:  { type: Number, default: 0, min: 0 },
    forks:       { type: Number, default: 0, min: 0 },
    isForked:    { type: Boolean, default: false },
    updatedAt:   { type: Date },
  },
  { _id: false }
);

const gitHubProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // The GitHub username the student connected
    username: {
      type: String,
      trim: true,
      default: '',
    },

    // Whether a successful sync has been completed
    connected: {
      type: Boolean,
      default: false,
    },

    // ─── Data from GitHub API /users/{username} ───
    name:        { type: String, trim: true, default: '' },
    bio:         { type: String, trim: true, default: '' },
    avatarUrl:   { type: String, trim: true, default: '' },
    profileUrl:  { type: String, trim: true, default: '' },
    publicRepos: { type: Number, default: 0, min: 0 },
    followers:   { type: Number, default: 0, min: 0 },
    following:   { type: Number, default: 0, min: 0 },
    publicGists: { type: Number, default: 0, min: 0 },
    company:     { type: String, trim: true, default: '' },
    location:    { type: String, trim: true, default: '' },
    blog:        { type: String, trim: true, default: '' },
    createdAt:   { type: Date },         // GitHub account creation date

    // ─── Computed from repos ──────────────────────
    totalStars:  { type: Number, default: 0, min: 0 },
    totalForks:  { type: Number, default: 0, min: 0 },
    // Top-5 languages by repo count
    languages:   { type: [String], default: [] },

    // Top 6 repos sorted by stars desc (non-forked preferred)
    repositories: { type: [repoSchema], default: [] },

    // When we last successfully synced with GitHub
    lastSyncedAt: { type: Date, default: null },

    // Last error message if sync failed
    lastSyncError: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GitHubProfile', gitHubProfileSchema);
