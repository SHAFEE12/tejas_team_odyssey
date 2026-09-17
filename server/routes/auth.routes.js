const express = require('express');

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateAvatar,
  deleteAvatar,
  updateUserProfile
} = require('../controllers/auth.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { uploadAvatar } = require('../services/avatarStorage.service');

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get(
  '/me',
  requireAuth,
  getCurrentUser
);

router.patch(
  '/profile',
  requireAuth,
  updateUserProfile
);

router.put(
  '/profile',
  requireAuth,
  updateUserProfile
);

router.post(
  '/avatar',
  requireAuth,
  (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      next();
    });
  },
  updateAvatar
);

router.delete(
  '/avatar',
  requireAuth,
  deleteAvatar
);

router.get(
  '/student-test',
  requireAuth,
  requireRole('student'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Student access granted',
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    });
  }
);

module.exports = router;