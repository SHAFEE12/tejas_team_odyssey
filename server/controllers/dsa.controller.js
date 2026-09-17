const DSAProfile = require('../models/DSAProfile');
const { fetchLeetCodeProfile } = require('../services/leetcode.service');

/**
 * getDSAProfile — GET /api/dsa
 * Returns the authenticated student's DSA profile.
 * 404 if not created yet.
 */
const getDSAProfile = async (req, res) => {
  try {
    const profile = await DSAProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'DSA profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get DSA profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching DSA profile',
    });
  }
};

/**
 * upsertDSAProfile — PUT /api/dsa
 * Creates or updates the student's manual DSA profile.
 */
const upsertDSAProfile = async (req, res) => {
  try {
    const {
      leetcodeUsername,
      easySolved,
      mediumSolved,
      hardSolved,
      targetTotal,
      currentStreak,
      longestStreak,
      focusTopics,
    } = req.body;

    const update = { lastUpdated: new Date() };

    if (leetcodeUsername !== undefined) {
      const cleaned = String(leetcodeUsername).trim().toLowerCase();
      if (cleaned.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'LeetCode username must be 50 characters or fewer',
        });
      }
      update.leetcodeUsername = cleaned;
    }

    const numericFields = { easySolved, mediumSolved, hardSolved, targetTotal, currentStreak, longestStreak };
    for (const [field, val] of Object.entries(numericFields)) {
      if (val !== undefined) {
        const n = Number(val);
        if (!Number.isFinite(n) || n < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-negative number`,
          });
        }
        update[field] = Math.floor(n);
      }
    }

    if (focusTopics !== undefined) {
      if (!Array.isArray(focusTopics)) {
        return res.status(400).json({
          success: false,
          message: 'focusTopics must be an array',
        });
      }
      update.focusTopics = focusTopics
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0 && t.length <= 50)
        .slice(0, 20);
    }

    const profile = await DSAProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'DSA profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Upsert DSA profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating DSA profile',
    });
  }
};

/**
 * connectLeetCode — POST /api/dsa/connect
 * Validates, connects, and performs initial sync for a public LeetCode username.
 */
const connectLeetCode = async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;

    if (!leetcodeUsername || typeof leetcodeUsername !== 'string' || !leetcodeUsername.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid LeetCode username.',
      });
    }

    const username = leetcodeUsername.trim();

    // Query LeetCode GraphQL
    let lcData = null;
    try {
      lcData = await fetchLeetCodeProfile(username);
    } catch (apiErr) {
      if (apiErr.message === 'LEETCODE_RATE_LIMITED') {
        return res.status(429).json({
          success: false,
          message: 'LeetCode sync is temporarily rate-limited. Please try again in a few minutes.',
        });
      }
      return res.status(502).json({
        success: false,
        message: 'LeetCode service is currently unreachable. Please try again later.',
      });
    }

    if (!lcData) {
      return res.status(404).json({
        success: false,
        message: `LeetCode profile "${username}" was not found. Please verify the public username.`,
      });
    }

    // Save profile with synced data
    const update = {
      leetcodeUsername: lcData.username,
      leetcodeProfileUrl: lcData.profileUrl,
      leetcodeConnected: true,
      leetcodeSyncStatus: 'synced',
      leetcodeLastSyncedAt: new Date(),
      leetcodeSyncError: null,
      leetcodeSource: 'public_profile',
      leetcodeData: lcData,
    };

    const profile = await DSAProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully connected LeetCode profile @${lcData.username}`,
      profile,
    });
  } catch (error) {
    console.error('Connect LeetCode error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while connecting LeetCode profile',
    });
  }
};

/**
 * syncLeetCode — POST /api/dsa/sync
 * Re-fetches latest public LeetCode problem counts for the connected student.
 */
const syncLeetCode = async (req, res) => {
  try {
    const profile = await DSAProfile.findOne({ user: req.user._id });

    if (!profile || !profile.leetcodeUsername) {
      return res.status(400).json({
        success: false,
        message: 'No LeetCode profile is currently connected. Please connect your username first.',
      });
    }

    let lcData = null;
    try {
      lcData = await fetchLeetCodeProfile(profile.leetcodeUsername);
    } catch (apiErr) {
      if (apiErr.message === 'LEETCODE_RATE_LIMITED') {
        profile.leetcodeSyncStatus = 'error';
        profile.leetcodeSyncError = 'LeetCode API rate limit reached. Cached data preserved.';
        await profile.save();

        return res.status(429).json({
          success: false,
          message: 'LeetCode sync is temporarily rate-limited. Preserved last successful data.',
          profile,
        });
      }

      profile.leetcodeSyncStatus = 'error';
      profile.leetcodeSyncError = 'LeetCode connection timed out. Cached data preserved.';
      await profile.save();

      return res.status(502).json({
        success: false,
        message: 'LeetCode service is currently unreachable. Previous data has been preserved.',
        profile,
      });
    }

    if (!lcData) {
      profile.leetcodeSyncStatus = 'error';
      profile.leetcodeSyncError = `LeetCode user "${profile.leetcodeUsername}" not found.`;
      await profile.save();

      return res.status(404).json({
        success: false,
        message: 'LeetCode profile could not be found. Please check your username.',
        profile,
      });
    }

    profile.leetcodeConnected = true;
    profile.leetcodeProfileUrl = lcData.profileUrl;
    profile.leetcodeSyncStatus = 'synced';
    profile.leetcodeLastSyncedAt = new Date();
    profile.leetcodeSyncError = null;
    profile.leetcodeSource = 'public_profile';
    profile.leetcodeData = lcData;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'LeetCode statistics synced successfully.',
      profile,
    });
  } catch (error) {
    console.error('Sync LeetCode error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while syncing LeetCode data',
    });
  }
};

/**
 * disconnectLeetCode — POST /api/dsa/disconnect & DELETE /api/dsa/disconnect
 * Disconnects LeetCode account while preserving personal practice streaks & targets.
 */
const disconnectLeetCode = async (req, res) => {
  try {
    const profile = await DSAProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'DSA profile not found',
      });
    }

    profile.leetcodeConnected = false;
    profile.leetcodeSyncStatus = 'never_synced';
    profile.leetcodeSyncError = null;
    profile.leetcodeSource = 'manual';
    profile.leetcodeData = null;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'LeetCode profile disconnected successfully.',
      profile,
    });
  } catch (error) {
    console.error('Disconnect LeetCode error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while disconnecting LeetCode profile',
    });
  }
};

module.exports = {
  getDSAProfile,
  upsertDSAProfile,
  connectLeetCode,
  syncLeetCode,
  disconnectLeetCode,
};
