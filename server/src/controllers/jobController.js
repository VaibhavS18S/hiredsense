const Job = require('../models/Job');
const Application = require('../models/Application');
const { analyzeJobReadiness, generateJobEnhancements } = require('../services/jobIntelligence/jobAnalyzer');
const { logActivity } = require('../services/auditLogger');

// @desc    Get all jobs for organization
// @route   GET /api/jobs
const getJobs = async (req, res, next) => {
  try {
    const { status, search, department } = req.query;
    const filter = { organization: req.organizationId };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (department && department !== 'all') {
      filter.department = department;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    // Attach candidate counts per job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const totalCandidates = await Application.countDocuments({ jobId: job._id });
        const shortlistedCandidates = await Application.countDocuments({
          jobId: job._id,
          stage: { $in: ['Shortlisted', 'Interview', 'Offer', 'Hired'] },
        });
        return {
          ...job.toObject(),
          totalCandidates,
          shortlistedCandidates,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithCounts.length,
      data: jobsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    }).populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const totalCandidates = await Application.countDocuments({ jobId: job._id });
    const stagesBreakdown = await Application.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        totalCandidates,
        stagesBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new job
// @route   POST /api/jobs
const createJob = async (req, res, next) => {
  try {
    const jobData = {
      ...req.body,
      organization: req.organizationId,
      createdBy: req.user._id,
    };

    // Run Readiness Analysis
    const readiness = analyzeJobReadiness(jobData);
    jobData.readinessScore = readiness.clarityScore;
    jobData.readinessAnalysis = readiness;

    const job = await Job.create(jobData);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'JOB_CREATED',
      entityType: 'Job',
      entityId: job._id,
      details: { title: job.title, department: job.department },
      req,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing job
// @route   PUT /api/jobs/:id
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Recalculate readiness
    const updatedData = { ...req.body };
    const readiness = analyzeJobReadiness({ ...job.toObject(), ...updatedData });
    updatedData.readinessScore = readiness.clarityScore;
    updatedData.readinessAnalysis = readiness;

    job = await Job.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'JOB_UPDATED',
      entityType: 'Job',
      entityId: job._id,
      details: { title: job.title },
      req,
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate job
// @route   POST /api/jobs/:id/duplicate
const duplicateJob = async (req, res, next) => {
  try {
    const original = await Job.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Original job not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.title = `${original.title} (Copy)`;
    duplicateData.status = 'draft';
    duplicateData.createdBy = req.user._id;

    const newJob = await Job.create(duplicateData);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'JOB_DUPLICATED',
      entityType: 'Job',
      entityId: newJob._id,
      details: { originalId: original._id, newTitle: newJob.title },
      req,
    });

    res.status(201).json({
      success: true,
      data: newJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive or toggle status of job
// @route   PATCH /api/jobs/:id/status
const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: `JOB_STATUS_${status.toUpperCase()}`,
      entityType: 'Job',
      entityId: job._id,
      details: { status },
      req,
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'JOB_DELETED',
      entityType: 'Job',
      entityId: req.params.id,
      details: { title: job.title },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Job removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze raw job text or draft parameters
// @route   POST /api/jobs/analyze
const analyzeJob = async (req, res, next) => {
  try {
    const readiness = analyzeJobReadiness(req.body);
    res.status(200).json({
      success: true,
      data: readiness,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI enhancements and skills for a job title
// @route   POST /api/jobs/enhance
const enhanceJobWithAI = async (req, res, next) => {
  try {
    const { title } = req.body;
    const suggestions = generateJobEnhancements(title);
    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  duplicateJob,
  updateJobStatus,
  deleteJob,
  analyzeJob,
  enhanceJobWithAI,
};
