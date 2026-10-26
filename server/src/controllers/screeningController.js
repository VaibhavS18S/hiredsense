const ScreeningResult = require('../models/ScreeningResult');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const ScoringConfig = require('../models/ScoringConfig');
const { calculateCandidateMatch } = require('../services/matchingEngine/scoringEngine');
const { logActivity } = require('../services/auditLogger');

// @desc    Get screening results for a job
// @route   GET /api/screening/job/:jobId
const getJobScreeningResults = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { minScore } = req.query;

    const filter = {
      jobId,
      organization: req.organizationId,
    };

    if (minScore) {
      filter.overallScore = { $gte: Number(minScore) };
    }

    const results = await ScreeningResult.find(filter)
      .sort({ overallScore: -1 })
      .populate('candidateId')
      .populate('resumeId', 'fileName qualityScore qualityIssues isDuplicate');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single screening result detail
// @route   GET /api/screening/:id
const getScreeningResultById = async (req, res, next) => {
  try {
    const result = await ScreeningResult.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    })
      .populate('candidateId')
      .populate('jobId')
      .populate('resumeId')
      .populate('notes.author', 'name email avatar');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Screening result not found' });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recruiter manual override (Module E)
// @route   PATCH /api/screening/:id/override
const overrideScreeningScore = async (req, res, next) => {
  try {
    const { adjustedScore, reason } = req.body;

    if (typeof adjustedScore !== 'number' || adjustedScore < 0 || adjustedScore > 100) {
      return res.status(400).json({ success: false, message: 'Please provide a valid adjusted score between 0 and 100' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Recruiter justification reason is required for auditability' });
    }

    const result = await ScreeningResult.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Screening result not found' });
    }

    const originalScore = result.recruiterOverride.isOverridden
      ? result.recruiterOverride.originalScore
      : result.overallScore;

    result.recruiterOverride = {
      isOverridden: true,
      originalScore: originalScore,
      adjustedScore: adjustedScore,
      reason: reason,
      overriddenBy: req.user._id,
      overriddenAt: new Date(),
    };

    result.overallScore = adjustedScore;
    await result.save();

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'CANDIDATE_SCORE_OVERRIDDEN',
      entityType: 'ScreeningResult',
      entityId: result._id,
      details: { previousScore: originalScore, newScore: adjustedScore, reason },
      req,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare 2 to 4 candidates side-by-side (Module F - Candidate Comparison Studio)
// @route   POST /api/screening/compare
const compareCandidates = async (req, res, next) => {
  try {
    const { candidateIds, jobId } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Please select between 2 and 4 candidates for comparison',
      });
    }

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job opening context is required for candidate comparison' });
    }

    const job = await Job.findOne({ _id: jobId, organization: req.organizationId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    // Retrieve candidates and their screening results for this job
    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
      organization: req.organizationId,
    });

    const screeningResults = await ScreeningResult.find({
      candidateId: { $in: candidateIds },
      jobId: job._id,
      organization: req.organizationId,
    }).populate('resumeId', 'qualityScore fileName');

    const resultsMap = {};
    screeningResults.forEach((sr) => {
      resultsMap[sr.candidateId.toString()] = sr;
    });

    // Form comparison cards
    const comparisonCards = candidates.map((cand) => {
      const sr = resultsMap[cand._id.toString()];
      return {
        candidate: {
          _id: cand._id,
          name: cand.name,
          email: cand.email,
          location: cand.location,
          totalExperienceYears: cand.totalExperienceYears,
          skills: cand.skills,
          education: cand.educationTimeline,
        },
        screening: sr || {
          overallScore: 0,
          componentScores: { skillAlignment: 0, semanticSimilarity: 0, experienceScore: 0, qualificationScore: 0 },
          matchedRequiredSkills: [],
          missingRequiredSkills: (job.mandatorySkills || []).map((m) => m.name),
          supportingExcerpts: [],
          dataQualityWarnings: ['Candidate not yet screened for this role'],
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          _id: job._id,
          title: job.title,
          department: job.department,
          mandatorySkills: job.mandatorySkills,
          preferredSkills: job.preferredSkills,
          minYearsExperience: job.minYearsExperience,
          qualifications: job.qualifications,
        },
        candidates: comparisonCards,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobScreeningResults,
  getScreeningResultById,
  overrideScreeningScore,
  compareCandidates,
};
