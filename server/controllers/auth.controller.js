// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const generateToken = require('../utils/generateToken');

// const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, email and password are required'
//       });
//     }

//     const normalizedEmail = email.toLowerCase().trim();

//     const existingUser = await User.findOne({
//       email: normalizedEmail
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'User with this email already exists'
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const user = await User.create({
//       name: name.trim(),
//       email: normalizedEmail,
//       password: hashedPassword,
//       role: role || 'student'
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar,
//         isActive: user.isActive,
//         createdAt: user.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error.message);

//     return res.status(500).json({
//       success: false,
//       message: 'Server error during registration'
//     });
//   }
// };

// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and password are required'
//       });
//     }

//     const normalizedEmail = email.toLowerCase().trim();

//     const user = await User.findOne({
//       email: normalizedEmail
//     });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Your account is inactive'
//       });
//     }

//     const passwordMatches = await bcrypt.compare(
//       password,
//       user.password
//     );

//     if (!passwordMatches) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     const token = generateToken(user);

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar,
//         isActive: user.isActive
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error.message);

//     return res.status(500).json({
//       success: false,
//       message: 'Server error during login'
//     });
//   }
// };

// const getCurrentUser = async (req, res) => {
//   try {
//     return res.status(200).json({
//       success: true,
//       user: {
//         id: req.user._id,
//         name: req.user.name,
//         email: req.user.email,
//         role: req.user.role,
//         avatar: req.user.avatar,
//         isActive: req.user.isActive,
//         createdAt: req.user.createdAt,
//         updatedAt: req.user.updatedAt
//       }
//     });
//   } catch (error) {
//     console.error('Get current user error:', error.message);

//     return res.status(500).json({
//       success: false,
//       message: 'Server error while fetching user'
//     });
//   }
// };

// module.exports = {
//   registerUser,
//   loginUser,
//   getCurrentUser
// };

const bcrypt = require('bcryptjs');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      registrationNumber,
      collegeName
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const ALLOWED_ROLES = [
      'student',
      'industry',
      'academician',
      'institution',
      'institution_admin'
    ];

    const assignedRole =
      role && ALLOWED_ROLES.includes(role)
        ? role
        : 'student';

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole
    };

    if (
      registrationNumber &&
      String(registrationNumber).trim()
    ) {
      userData.registrationNumber =
        String(registrationNumber).trim();
    }

    if (
      collegeName &&
      String(collegeName).trim()
    ) {
      userData.collegeName =
        String(collegeName).trim();
    }

    const user = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber:
          user.registrationNumber || '',
        collegeName:
          user.collegeName || '',
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(
      'Registration error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber:
          user.registrationNumber || '',
        collegeName:
          user.collegeName || '',
        avatar: user.avatar,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(
      'Login error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        registrationNumber:
          req.user.registrationNumber || '',
        collegeName:
          req.user.collegeName || '',
        avatar: req.user.avatar,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    console.error(
      'Get current user error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

const {
  deleteAvatarFile,
  saveAvatarFile
} = require('../services/avatarStorage.service');

const updateAvatar = async (req, res) => {
  try {
    let newAvatarUrl = '';

    if (req.file) {
      const buffer =
        req.file.buffer ||
        (req.file.path
          ? require('fs').readFileSync(
              req.file.path
            )
          : null);

      if (!buffer) {
        return res.status(400).json({
          success: false,
          message:
            'Unable to read avatar file data'
        });
      }

      const saved = await saveAvatarFile(
        buffer,
        req.file.originalname,
        req.file.mimetype
      );

      newAvatarUrl = saved.url;
    } else if (
      req.body &&
      req.body.avatar
    ) {
      newAvatarUrl =
        req.body.avatar.trim();
    }

    if (!newAvatarUrl) {
      return res.status(400).json({
        success: false,
        message:
          'No image file or avatar URL provided'
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clean up previous disk avatar if stored locally
    if (
      user.avatar &&
      user.avatar !== newAvatarUrl
    ) {
      await deleteAvatarFile(user.avatar);
    }

    user.avatar = newAvatarUrl;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Profile picture updated successfully',
      avatar: user.avatar,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber:
          user.registrationNumber || '',
        collegeName:
          user.collegeName || '',
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(
      'Update avatar error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Server error while updating avatar'
    });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.avatar) {
      await deleteAvatarFile(user.avatar);

      user.avatar = '';

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message:
        'Profile picture removed successfully',
      avatar: '',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber:
          user.registrationNumber || '',
        collegeName:
          user.collegeName || '',
        avatar: '',
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(
      'Delete avatar error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Server error while deleting avatar'
    });
  }
};

/**
 * Update the authenticated user's academic profile information.
 */
const updateUserProfile = async (req, res) => {
  try {
    const {
      registrationNumber,
      collegeName
    } = req.body;

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (
      registrationNumber !== undefined
    ) {
      user.registrationNumber =
        String(registrationNumber).trim();
    }

    if (
      collegeName !== undefined
    ) {
      user.collegeName =
        String(collegeName).trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber:
          user.registrationNumber || '',
        collegeName:
          user.collegeName || '',
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(
      'Update profile error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Server error while updating profile'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateAvatar,
  deleteAvatar,
  updateUserProfile
};