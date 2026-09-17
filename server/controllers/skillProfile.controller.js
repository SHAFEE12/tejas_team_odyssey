const SkillProfile = require('../models/SkillProfile');
const StudentProfile = require('../models/StudentProfile');
const AcademicianProfile = require('../models/AcademicianProfile');

async function resolveStudentMentorInfo(userId) {
  try {
    const studentProfile = await StudentProfile.findOne({ user: userId })
      .populate('assignedMentor', 'name email collegeName')
      .populate('institution', 'name code domain')
      .lean();

    if (!studentProfile) return { studentProfile: null, assignedMentor: null };

    let assignedMentor = null;
    if (studentProfile.assignedMentor) {
      const acadProfile = await AcademicianProfile.findOne({
        user: studentProfile.assignedMentor._id || studentProfile.assignedMentor
      })
        .populate('institution', 'name code')
        .lean();

      assignedMentor = {
        id: studentProfile.assignedMentor._id,
        name: studentProfile.assignedMentor.name,
        email: studentProfile.assignedMentor.email,
        department: acadProfile?.department || 'Computer Science & Engineering',
        designation: acadProfile?.designation || 'Faculty Mentor',
        institution: acadProfile?.institution?.name || studentProfile.institution?.name || studentProfile.assignedMentor.collegeName || 'Institution',
        status: 'Assigned'
      };
    }

    return { studentProfile, assignedMentor };
  } catch (err) {
    console.error('Error resolving student mentor info:', err.message);
    return { studentProfile: null, assignedMentor: null };
  }
}

const getMySkillProfile = async (req, res) => {
  try {
    let profile = await SkillProfile.findOne({
      user: req.user._id
    }).lean();

    const { studentProfile, assignedMentor } = await resolveStudentMentorInfo(req.user._id);

    if (!profile) {
      if (studentProfile) {
        return res.status(200).json({
          success: true,
          profile: {
            user: req.user._id,
            skills: [],
            targetRole: '',
            targetIndustry: '',
            assignedMentor,
            studentProfile
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Skill profile not found'
      });
    }

    profile.assignedMentor = assignedMentor;
    profile.studentProfile = studentProfile;

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get skill profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching skill profile'
    });
  }
};

const createSkillProfile = async (req, res) => {
  try {
    const {
      skills,
      targetRole,
      targetIndustry
    } = req.body;

    const existingProfile = await SkillProfile.findOne({
      user: req.user._id
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Skill profile already exists'
      });
    }

    const profile = await SkillProfile.create({
      user: req.user._id,
      skills: Array.isArray(skills) ? skills : [],
      targetRole: targetRole || '',
      targetIndustry: targetIndustry || ''
    });

    const { studentProfile, assignedMentor } = await resolveStudentMentorInfo(req.user._id);
    const profileObj = profile.toObject();
    profileObj.assignedMentor = assignedMentor;
    profileObj.studentProfile = studentProfile;

    return res.status(201).json({
      success: true,
      message: 'Skill profile created successfully',
      profile: profileObj
    });
  } catch (error) {
    console.error('Create skill profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while creating skill profile'
    });
  }
};

const updateSkillProfile = async (req, res) => {
  try {
    const {
      skills,
      targetRole,
      targetIndustry
    } = req.body;

    const profile = await SkillProfile.findOne({
      user: req.user._id
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Skill profile not found'
      });
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          message: 'Skills must be an array'
        });
      }

      profile.skills = skills;
    }

    if (targetRole !== undefined) {
      profile.targetRole = targetRole;
    }

    if (targetIndustry !== undefined) {
      profile.targetIndustry = targetIndustry;
    }

    await profile.save();

    const { studentProfile, assignedMentor } = await resolveStudentMentorInfo(req.user._id);
    const profileObj = profile.toObject();
    profileObj.assignedMentor = assignedMentor;
    profileObj.studentProfile = studentProfile;

    return res.status(200).json({
      success: true,
      message: 'Skill profile updated successfully',
      profile: profileObj
    });
  } catch (error) {
    console.error('Update skill profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while updating skill profile'
    });
  }
};

module.exports = {
  getMySkillProfile,
  createSkillProfile,
  updateSkillProfile
};