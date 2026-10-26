const Application = require('../models/Application');
const ScreeningResult = require('../models/ScreeningResult');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/auditLogger');

const PIPELINE_STAGES = ['New', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

// @desc    Get Kanban board applications organized by stage
// @route   GET /api/pipeline
const getPipelineBoard = async (req, res, next) => {
  try {
    const { jobId, recruiterId, search } = req.query;
    const filter = { organization: req.organizationId };

    if (jobId && jobId !== 'all') {
      filter.jobId = jobId;
    }
    if (recruiterId && recruiterId !== 'all') {
      filter.assignedRecruiter = recruiterId;
    }

    const applications = await Application.find(filter)
      .populate('candidateId', 'name email location totalExperienceYears skills')
      .populate('jobId', 'title department')
      .populate('assignedRecruiter', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Fetch screening scores for these applications
    const candIds = applications.map((a) => a.candidateId ? a.candidateId._id : null).filter(Boolean);
    const screeningDocs = await ScreeningResult.find({
      candidateId: { $in: candIds },
      organization: req.organizationId,
      ...(jobId && jobId !== 'all' ? { jobId } : {}),
    }).select('candidateId jobId overallScore componentScores matchedRequiredSkills missingRequiredSkills');

    const scoreMap = {};
    screeningDocs.forEach((doc) => {
      scoreMap[`${doc.candidateId}_${doc.jobId}`] = doc;
    });

    // Group by stages
    const columns = {};
    PIPELINE_STAGES.forEach((stage) => {
      columns[stage] = {
        stage,
        count: 0,
        candidates: [],
      };
    });

    applications.forEach((app) => {
      if (!app.candidateId) return;

      // Filter by search query if present
      if (search) {
        const queryLower = search.toLowerCase();
        const candName = (app.candidateId.name || '').toLowerCase();
        const candEmail = (app.candidateId.email || '').toLowerCase();
        if (!candName.includes(queryLower) && !candEmail.includes(queryLower)) {
          return;
        }
      }

      const stageKey = columns[app.stage] ? app.stage : 'New';
      const screening = scoreMap[`${app.candidateId._id}_${app.jobId._id}`];

      columns[stageKey].candidates.push({
        _id: app._id,
        candidate: app.candidateId,
        job: app.jobId,
        assignedRecruiter: app.assignedRecruiter,
        stage: app.stage,
        stageHistory: app.stageHistory,
        notesCount: (app.notes || []).length,
        score: screening ? screening.overallScore : null,
        screeningId: screening ? screening._id : null,
        updatedAt: app.updatedAt,
      });

      columns[stageKey].count += 1;
    });

    res.status(200).json({
      success: true,
      data: {
        stages: PIPELINE_STAGES,
        columns,
        totalCandidates: applications.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single application stage (Drag-and-drop or manual move)
// @route   PATCH /api/pipeline/:applicationId/stage
const updateCandidateStage = async (req, res, next) => {
  try {
    const { stage, note } = req.body;
    const { applicationId } = req.params;

    if (!PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage. Allowed: ${PIPELINE_STAGES.join(', ')}` });
    }

    const app = await Application.findOne({
      _id: applicationId,
      organization: req.organizationId,
    }).populate('candidateId', 'name').populate('jobId', 'title');

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const previousStage = app.stage;
    app.stage = stage;
    app.stageHistory.push({
      stage,
      previousStage,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Stage updated from ${previousStage} to ${stage}`,
    });

    await app.save();

    // Notify assigned recruiter if not the one changing
    if (app.assignedRecruiter && app.assignedRecruiter.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: app.assignedRecruiter,
        title: 'Candidate Pipeline Stage Changed',
        message: `${app.candidateId.name} was moved to ${stage} for ${app.jobId.title}`,
        type: 'stage_change',
        link: `/candidates/${app.candidateId._id}`,
        organization: req.organizationId,
      });
    }

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'STAGE_CHANGED',
      entityType: 'Application',
      entityId: app._id,
      details: { candidate: app.candidateId.name, previousStage, newStage: stage },
      req,
    });

    res.status(200).json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update stage for multiple candidates
// @route   POST /api/pipeline/bulk-stage
const bulkUpdateStage = async (req, res, next) => {
  try {
    const { applicationIds, targetStage, note } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one candidate application' });
    }

    if (!PIPELINE_STAGES.includes(targetStage)) {
      return res.status(400).json({ success: false, message: `Invalid stage: ${targetStage}` });
    }

    const updated = await Promise.all(
      applicationIds.map(async (id) => {
        const app = await Application.findOne({ _id: id, organization: req.organizationId });
        if (app) {
          const prev = app.stage;
          app.stage = targetStage;
          app.stageHistory.push({
            stage: targetStage,
            previousStage: prev,
            changedBy: req.user._id,
            changedAt: new Date(),
            note: note || `Bulk stage update to ${targetStage}`,
          });
          return await app.save();
        }
        return null;
      })
    );

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'BULK_STAGE_CHANGED',
      entityType: 'Application',
      details: { count: applicationIds.length, targetStage },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Updated ${applicationIds.length} candidate(s) to ${targetStage}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Undo stage change
// @route   POST /api/pipeline/:applicationId/undo
const undoStageChange = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const app = await Application.findOne({ _id: applicationId, organization: req.organizationId });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.stageHistory.length < 2) {
      return res.status(400).json({ success: false, message: 'No prior stage history to revert to' });
    }

    // Pop the latest history and revert to prior
    const lastItem = app.stageHistory[app.stageHistory.length - 1];
    const previous = lastItem.previousStage || 'New';

    app.stage = previous;
    app.stageHistory.push({
      stage: previous,
      previousStage: lastItem.stage,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: 'Reverted stage change',
    });

    await app.save();

    res.status(200).json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPipelineBoard,
  updateCandidateStage,
  bulkUpdateStage,
  undoStageChange,
};
