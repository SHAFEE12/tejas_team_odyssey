const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    role: {
      type: String,
      required: true,
      enum: [
        'student',
        'academician',
        'institution_admin',
        'institution', // backward-compatible alias for institution_admin
        'industry',
        'super_admin'
      ],
      default: 'student'
    },

    // Optional linkages for shared multi-tenant hierarchy
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null
    },

    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      default: null
    },

    registrationNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },

    collegeName: {
      type: String,
      trim: true
    },

    academicianId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    avatar: {
      type: String,
      default: ''
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);