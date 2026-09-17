/**
 * ecosystem.controller.js
 *
 * Multi-role ecosystem endpoints providing role profile discovery,
 * institution listings, and canonical skill taxonomy access.
 */

const User = require('../models/User');
const Institution = require('../models/Institution');
const Industry = require('../models/Industry');
const StudentProfile = require('../models/StudentProfile');
const AcademicianProfile = require('../models/AcademicianProfile');
const Skill = require('../models/Skill');
const Opportunity = require('../models/Opportunity');

/**
 * Get active user's ecosystem role profile and contextual metadata
 * GET /api/ecosystem/profile
 */
const getEcosystemProfile = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;

    let roleData = null;

    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({ user: user._id })
        .populate('institution', 'name code domain')
        .populate('assignedMentor', 'name email collegeName')
        .lean();

      if (studentProfile && studentProfile.assignedMentor) {
        const acadProfile = await AcademicianProfile.findOne({
          user: studentProfile.assignedMentor._id || studentProfile.assignedMentor,
        })
          .populate('institution', 'name code')
          .lean();

        studentProfile.assignedMentor = {
          id: studentProfile.assignedMentor._id,
          name: studentProfile.assignedMentor.name,
          email: studentProfile.assignedMentor.email,
          department: acadProfile?.department || 'Computer Science & Engineering',
          designation: acadProfile?.designation || 'Faculty Mentor',
          institution:
            acadProfile?.institution?.name ||
            studentProfile.institution?.name ||
            studentProfile.assignedMentor.collegeName ||
            'Institution',
          status: 'Assigned',
        };
      }

      roleData = studentProfile || {
        user: user._id,
        department: 'Computer Science',
        degree: 'B.Tech',
        institution: null,
        assignedMentor: null,
      };
    } else if (role === 'academician') {
      const academicianProfile = await AcademicianProfile.findOne({ user: user._id })
        .populate('institution', 'name code domain')
        .populate('assignedStudents', 'name email registrationNumber')
        .lean();

      roleData = academicianProfile || {
        user: user._id,
        department: 'Computer Science',
        designation: 'Faculty Mentor',
        institution: null,
        assignedStudents: [],
      };
    } else if (role === 'institution_admin' || role === 'institution') {
      const institution = await Institution.findOne({
        $or: [{ adminUser: user._id }, { _id: user.institution }],
      }).lean();

      let studentCount = 0;
      let academicianCount = 0;

      if (institution) {
        studentCount = await StudentProfile.countDocuments({ institution: institution._id });
        academicianCount = await AcademicianProfile.countDocuments({ institution: institution._id });
      }

      roleData = {
        institution: institution || null,
        metrics: {
          totalStudents: studentCount,
          totalAcademicians: academicianCount,
        },
      };
    } else if (role === 'industry') {
      const industry = await Industry.findOne({
        $or: [{ adminUser: user._id }, { _id: user.industry }],
      }).lean();

      const activePostings = industry
        ? await Opportunity.countDocuments({ company: industry.companyName, active: true })
        : 0;

      roleData = {
        industry: industry || null,
        metrics: {
          activePostings,
        },
      };
    } else if (role === 'super_admin') {
      const [institutionsCount, industriesCount, usersCount] = await Promise.all([
        Institution.countDocuments(),
        Industry.countDocuments(),
        User.countDocuments(),
      ]);

      roleData = {
        systemOverview: {
          totalInstitutions: institutionsCount,
          totalIndustries: industriesCount,
          totalUsers: usersCount,
        },
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        roleData,
        institution: roleData?.institution || null,
        industry: roleData?.industry || null,
        studentProfile: role === 'student' ? roleData : null,
        academicianProfile: role === 'academician' ? roleData : null,
      },
    });
  } catch (error) {
    console.error('getEcosystemProfile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ecosystem profile',
    });
  }
};

/**
 * List verified institutions (for student or academician affiliation)
 * GET /api/ecosystem/institutions
 */
const listInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find({ isActive: true })
      .select('name code domain departments address')
      .lean();

    return res.status(200).json({
      success: true,
      count: institutions.length,
      data: institutions,
    });
  } catch (error) {
    console.error('listInstitutions error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list institutions',
    });
  }
};

/**
 * List canonical skills taxonomy
 * GET /api/ecosystem/skills
 */
const listSkills = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isVerified: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { aliases: { $regex: search, $options: 'i' } },
      ];
    }

    const skills = await Skill.find(query).sort({ category: 1, name: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    console.error('listSkills error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list skills',
    });
  }
};

module.exports = {
  getEcosystemProfile,
  listInstitutions,
  listSkills,
};
