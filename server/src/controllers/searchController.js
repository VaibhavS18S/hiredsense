const Candidate = require('../models/Candidate');
const SavedSearch = require('../models/SavedSearch');
const ScreeningResult = require('../models/ScreeningResult');
const Resume = require('../models/Resume');
const { logActivity } = require('../services/auditLogger');

// @desc    Full-text and multi-faceted talent pool search
// @route   POST /api/search/talent-pool
const searchTalentPool = async (req, res, next) => {
  try {
    const {
      keyword,
      skills = [],
      minExp = 0,
      maxExp = 35,
      minScore = 0,
      maxScore = 100,
      location,
      jobId,
    } = req.body;

    const query = { organization: req.organizationId };

    // 1. Text keyword search
    if (keyword && keyword.trim()) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } },
        { 'skills.name': { $regex: keyword, $options: 'i' } },
        { headline: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 2. Experience range
    query.totalExperienceYears = {
      $gte: Number(minExp),
      $lte: Number(maxExp),
    };

    // 3. Location filter
    if (location && location.trim()) {
      query.location = { $regex: location, $options: 'i' };
    }

    // 4. Skills filter (all required)
    if (Array.isArray(skills) && skills.length > 0) {
      query['skills.name'] = { $all: skills.map((s) => new RegExp(`^${s}$`, 'i')) };
    }

    let candidates = await Candidate.find(query).sort({ updatedAt: -1 }).limit(100);

    // 5. Match Score filter if requested
    const candidateIds = candidates.map((c) => c._id);
    const screeningQuery = {
      candidateId: { $in: candidateIds },
      organization: req.organizationId,
    };
    if (jobId) screeningQuery.jobId = jobId;

    const screeningResults = await ScreeningResult.find(screeningQuery)
      .populate('jobId', 'title department')
      .sort({ overallScore: -1 });

    const scoreMap = {};
    screeningResults.forEach((sr) => {
      if (!scoreMap[sr.candidateId.toString()] || sr.overallScore > scoreMap[sr.candidateId.toString()].overallScore) {
        scoreMap[sr.candidateId.toString()] = sr;
      }
    });

    // Check duplicate resumes
    const duplicateResumes = await Resume.find({
      candidateId: { $in: candidateIds },
      isDuplicate: true,
      organization: req.organizationId,
    }).select('candidateId');
    const duplicateCandidateSet = new Set(duplicateResumes.map((r) => r.candidateId.toString()));

    // Combine and apply minScore/maxScore filtering
    let enriched = candidates.map((cand) => {
      const bestScreening = scoreMap[cand._id.toString()];
      return {
        ...cand.toObject(),
        bestMatchScore: bestScreening ? bestScreening.overallScore : null,
        bestMatchJob: bestScreening && bestScreening.jobId ? bestScreening.jobId.title : null,
        isDuplicate: duplicateCandidateSet.has(cand._id.toString()),
      };
    });

    if (minScore > 0 || maxScore < 100) {
      enriched = enriched.filter((c) => {
        if (c.bestMatchScore === null) return minScore === 0;
        return c.bestMatchScore >= minScore && c.bestMatchScore <= maxScore;
      });
    }

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved searches
// @route   GET /api/search/saved
const getSavedSearches = async (req, res, next) => {
  try {
    const saved = await SavedSearch.find({
      organization: req.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save new search preset
// @route   POST /api/search/saved
const createSavedSearch = async (req, res, next) => {
  try {
    const { name, filters } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a name for this search preset' });
    }

    const saved = await SavedSearch.create({
      name,
      filters,
      organization: req.organizationId,
      createdBy: req.user._id,
    });

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'SAVED_SEARCH_CREATED',
      entityType: 'Settings',
      entityId: saved._id,
      details: { name },
      req,
    });

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete saved search preset
// @route   DELETE /api/search/saved/:id
const deleteSavedSearch = async (req, res, next) => {
  try {
    const saved = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!saved) {
      return res.status(404).json({ success: false, message: 'Saved search not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Saved search deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTalentPool,
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
};
