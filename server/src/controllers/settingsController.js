const ScoringConfig = require('../models/ScoringConfig');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Resume = require('../models/Resume');
const ScreeningResult = require('../models/ScreeningResult');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../services/auditLogger');

// @desc    Get scoring weights configuration
// @route   GET /api/settings/scoring
const getScoringConfig = async (req, res, next) => {
  try {
    let config = await ScoringConfig.findOne({ organization: req.organizationId });
    if (!config) {
      config = await ScoringConfig.create({
        organization: req.organizationId,
        weights: { skills: 40, semantic: 30, experience: 20, qualification: 10 },
        minimumReviewThreshold: 60,
        shortlistThreshold: 75,
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update scoring weights configuration
// @route   PUT /api/settings/scoring
const updateScoringConfig = async (req, res, next) => {
  try {
    const { weights, minimumReviewThreshold, shortlistThreshold, penalizeMissingMandatory } = req.body;

    if (weights) {
      const sum = (Number(weights.skills) || 0) +
                  (Number(weights.semantic) || 0) +
                  (Number(weights.experience) || 0) +
                  (Number(weights.qualification) || 0);

      if (Math.round(sum) !== 100) {
        return res.status(400).json({
          success: false,
          message: `Active scoring weights must sum to exactly 100%. Current sum: ${sum}%`,
        });
      }
    }

    const config = await ScoringConfig.findOneAndUpdate(
      { organization: req.organizationId },
      {
        weights,
        minimumReviewThreshold,
        shortlistThreshold,
        penalizeMissingMandatory,
      },
      { new: true, upsert: true, runValidators: true }
    );

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'SCORING_CONFIG_UPDATED',
      entityType: 'Settings',
      details: { weights: config.weights },
      req,
    });

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Organization & Privacy Settings
// @route   GET /api/settings/organization
const getOrganizationSettings = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Organization & Privacy Settings
// @route   PUT /api/settings/organization
const updateOrganizationSettings = async (req, res, next) => {
  try {
    const { name, retentionDays, anonymizedScreening } = req.body;
    const org = await Organization.findById(req.organizationId);

    if (name) org.name = name;
    if (typeof retentionDays === 'number') org.retentionDays = retentionDays;
    if (typeof anonymizedScreening === 'boolean') org.anonymizedScreening = anonymizedScreening;

    await org.save();

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entityType: 'Settings',
      details: { retentionDays: org.retentionDays, anonymizedScreening: org.anonymizedScreening },
      req,
    });

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team members
// @route   GET /api/settings/team
const getTeamMembers = async (req, res, next) => {
  try {
    const members = await User.find({ organization: req.organizationId })
      .select('-password')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite / Add team member
// @route   POST /api/settings/team
const addTeamMember = async (req, res, next) => {
  try {
    const { name, email, role, title, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const newMember = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Welcome2026!',
      role: role || 'recruiter',
      title: title || 'Talent Acquisition Specialist',
      organization: req.organizationId,
    });

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'Settings',
      details: { invitedEmail: email, role },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newMember._id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        title: newMember.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export candidate data package (GDPR & Privacy Compliance)
// @route   GET /api/settings/privacy/export/:candidateId
const exportCandidateDataGDPR = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.candidateId,
      organization: req.organizationId,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate record not found' });
    }

    const resumes = await Resume.find({ candidateId: candidate._id }).select('-filePath');
    const applications = await Application.find({ candidateId: candidate._id }).populate('jobId', 'title department');
    const screenings = await ScreeningResult.find({ candidateId: candidate._id });

    const exportPackage = {
      compliance: 'GDPR / CCPA Candidate Data Portability Package',
      exportedAt: new Date().toISOString(),
      candidateProfile: candidate,
      uploadedResumes: resumes,
      recruitmentHistory: applications,
      screeningAssessments: screenings,
    };

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'CANDIDATE_DATA_EXPORTED_GDPR',
      entityType: 'Candidate',
      entityId: candidate._id,
      details: { candidateName: candidate.name },
      req,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=candidate_export_${candidate._id}.json`);
    res.status(200).json(exportPackage);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete candidate and all associated documents (GDPR Right to be Forgotten)
// @route   DELETE /api/settings/privacy/delete/:candidateId
const deleteCandidateGDPR = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.candidateId,
      organization: req.organizationId,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate record not found' });
    }

    // Cascade delete resumes, applications, screening results
    await Resume.deleteMany({ candidateId: candidate._id });
    await Application.deleteMany({ candidateId: candidate._id });
    await ScreeningResult.deleteMany({ candidateId: candidate._id });
    await Candidate.deleteOne({ _id: candidate._id });

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'CANDIDATE_DATA_PURGED_GDPR',
      entityType: 'Candidate',
      entityId: req.params.candidateId,
      details: { candidateName: candidate.name, status: 'PURGED_PERMANENTLY' },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate record and all associated resumes, applications, and screenings permanently purged.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/settings/audit
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ organization: req.organizationId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScoringConfig,
  updateScoringConfig,
  getOrganizationSettings,
  updateOrganizationSettings,
  getTeamMembers,
  addTeamMember,
  exportCandidateDataGDPR,
  deleteCandidateGDPR,
  getAuditLogs,
};
