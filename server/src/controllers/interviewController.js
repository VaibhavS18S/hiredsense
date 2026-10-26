const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const ScreeningResult = require('../models/ScreeningResult');
const { generateInterviewQuestions, DEFAULT_RUBRIC_CRITERIA } = require('../services/interviewService');
const { logActivity } = require('../services/auditLogger');

// @desc    Get all interviews for organization / recruiter
// @route   GET /api/interviews
const getInterviews = async (req, res, next) => {
  try {
    const { status, jobId } = req.query;
    const filter = { organization: req.organizationId };

    if (status && status !== 'all') filter.status = status;
    if (jobId && jobId !== 'all') filter.jobId = jobId;

    const interviews = await Interview.find(filter)
      .populate('candidateId', 'name email location totalExperienceYears')
      .populate('jobId', 'title department')
      .populate('interviewer', 'name email avatar')
      .sort({ scheduledAt: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview detail
// @route   GET /api/interviews/:id
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    })
      .populate('candidateId')
      .populate('jobId')
      .populate('interviewer', 'name email avatar')
      .populate('applicationId');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview record not found' });
    }

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Schedule interview and auto-generate suggested questions & rubric
// @route   POST /api/interviews
const createInterview = async (req, res, next) => {
  try {
    const { applicationId, stageName, scheduledAt, interviewerId } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      organization: req.organizationId,
    }).populate('candidateId').populate('jobId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Retrieve screening result for tailored questions
    const screening = await ScreeningResult.findOne({
      candidateId: application.candidateId._id,
      jobId: application.jobId._id,
    });

    // Generate questions targeting candidate's skills and gaps
    const suggestedQuestions = generateInterviewQuestions(application.jobId, application.candidateId, screening);

    const interview = await Interview.create({
      applicationId: application._id,
      candidateId: application.candidateId._id,
      jobId: application.jobId._id,
      interviewer: interviewerId || req.user._id,
      stageName: stageName || 'Technical & System Architecture Interview',
      scheduledAt: scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      suggestedQuestions,
      rubricScores: DEFAULT_RUBRIC_CRITERIA,
      organization: req.organizationId,
    });

    // Automatically update pipeline stage to 'Interview'
    if (application.stage !== 'Interview') {
      application.stage = 'Interview';
      application.stageHistory.push({
        stage: 'Interview',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Interview scheduled: ${interview.stageName}`,
      });
      await application.save();
    }

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'Interview',
      entityId: interview._id,
      details: { candidate: application.candidateId.name, job: application.jobId.title },
      req,
    });

    res.status(201).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interview rubrics, notes, and recommendation
// @route   PUT /api/interviews/:id
const updateInterview = async (req, res, next) => {
  try {
    const { rubricScores, generalNotes, recommendation, status, suggestedQuestions } = req.body;

    const interview = await Interview.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (rubricScores) interview.rubricScores = rubricScores;
    if (generalNotes !== undefined) interview.generalNotes = generalNotes;
    if (recommendation) interview.recommendation = recommendation;
    if (status) interview.status = status;
    if (suggestedQuestions) interview.suggestedQuestions = suggestedQuestions;

    await interview.save();

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'INTERVIEW_FEEDBACK_SUBMITTED',
      entityType: 'Interview',
      entityId: interview._id,
      details: { recommendation: interview.recommendation, status: interview.status },
      req,
    });

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
};
