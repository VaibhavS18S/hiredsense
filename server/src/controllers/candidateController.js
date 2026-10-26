const Candidate = require('../models/Candidate');
const Resume = require('../models/Resume');
const ScreeningResult = require('../models/ScreeningResult');
const Application = require('../models/Application');
const Organization = require('../models/Organization');
const { logActivity } = require('../services/auditLogger');

// @desc    Get candidates with pagination and filters
// @route   GET /api/candidates
const getCandidates = async (req, res, next) => {
  try {
    const { search, skill, minExp, stage, jobId, limit = 25, page = 1 } = req.query;
    const filter = { organization: req.organizationId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (skill) {
      filter['skills.name'] = { $regex: skill, $options: 'i' };
    }

    if (minExp) {
      filter.totalExperienceYears = { $gte: Number(minExp) };
    }

    const org = await Organization.findById(req.organizationId);
    const isAnonymized = org ? org.anonymizedScreening : false;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Candidate.countDocuments(filter);

    let candidates = await Candidate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach current applications / screening results if any
    const enriched = await Promise.all(
      candidates.map(async (cand) => {
        const applications = await Application.find({ candidateId: cand._id })
          .populate('jobId', 'title department status')
          .sort({ updatedAt: -1 });

        const latestScreening = await ScreeningResult.findOne({ candidateId: cand._id })
          .sort({ overallScore: -1 })
          .populate('jobId', 'title');

        const candObj = cand.toObject();

        if (isAnonymized) {
          candObj.name = `Candidate #${cand._id.toString().slice(-4).toUpperCase()}`;
          candObj.email = 'anonymized@screening.hire';
          candObj.phone = '***-***-****';
          candObj.links = {};
        }

        return {
          ...candObj,
          applications,
          latestScore: latestScreening ? latestScreening.overallScore : null,
          latestJobTitle: latestScreening && latestScreening.jobId ? latestScreening.jobId.title : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single candidate profile with resume and screening evidence
// @route   GET /api/candidates/:id
const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const org = await Organization.findById(req.organizationId);
    const isAnonymized = org ? org.anonymizedScreening : false;

    // Resumes
    const resumes = await Resume.find({ candidateId: candidate._id }).sort({ createdAt: -1 });

    // Applications & Screening Results
    const applications = await Application.find({ candidateId: candidate._id })
      .populate('jobId')
      .populate('assignedRecruiter', 'name email avatar')
      .sort({ createdAt: -1 });

    const screeningResults = await ScreeningResult.find({ candidateId: candidate._id })
      .populate('jobId', 'title department mandatorySkills preferredSkills')
      .populate('notes.author', 'name email avatar');

    const candObj = candidate.toObject();
    if (isAnonymized) {
      candObj.name = `Candidate #${candidate._id.toString().slice(-4).toUpperCase()}`;
      candObj.email = 'anonymized@screening.hire';
      candObj.phone = '***-***-****';
      candObj.links = {};
    }

    res.status(200).json({
      success: true,
      data: {
        candidate: candObj,
        resumes,
        applications,
        screeningResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update candidate parsed data (Correction Controls - Module D)
// @route   PUT /api/candidates/:id
const updateCandidateData = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const { name, email, phone, location, totalExperienceYears, skills, experienceTimeline, educationTimeline, headline } = req.body;

    const oldValues = {
      name: candidate.name,
      totalExperienceYears: candidate.totalExperienceYears,
      skillsCount: candidate.skills.length,
    };

    if (name) candidate.name = name;
    if (email) candidate.email = email;
    if (phone) candidate.phone = phone;
    if (location) candidate.location = location;
    if (headline) candidate.headline = headline;
    if (typeof totalExperienceYears === 'number') candidate.totalExperienceYears = totalExperienceYears;
    if (skills) candidate.skills = skills;
    if (experienceTimeline) candidate.experienceTimeline = experienceTimeline;
    if (educationTimeline) candidate.educationTimeline = educationTimeline;

    // Record data correction audit entry
    candidate.dataCorrections.push({
      field: 'Candidate Profile Update',
      oldValue: oldValues,
      newValue: { name, totalExperienceYears, skillsCount: skills ? skills.length : undefined },
      correctedBy: req.user._id,
      correctedAt: new Date(),
    });

    await candidate.save();

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'CANDIDATE_DATA_CORRECTED',
      entityType: 'Candidate',
      entityId: candidate._id,
      details: { candidateName: candidate.name },
      req,
    });

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add recruiter note to candidate
// @route   POST /api/candidates/:id/notes
const addCandidateNote = async (req, res, next) => {
  try {
    const { text, applicationId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    if (applicationId) {
      const app = await Application.findById(applicationId);
      if (app) {
        app.notes.push({
          author: req.user._id,
          text,
          createdAt: new Date(),
        });
        await app.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  updateCandidateData,
  addCandidateNote,
};
