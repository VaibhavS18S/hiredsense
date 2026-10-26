const ScreeningResult = require('../models/ScreeningResult');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const { logActivity } = require('../services/auditLogger');

// @desc    Get aggregate screening & recruitment reports
// @route   GET /api/reports/summary
const getReportsSummary = async (req, res, next) => {
  try {
    const { jobId, dateRange } = req.query;
    const orgId = req.organizationId;

    // Filter
    const filter = { organization: orgId };
    if (jobId && jobId !== 'all') {
      filter.jobId = jobId;
    }

    // 1. Job-wise screening summary
    const jobs = await Job.find({ organization: orgId }).select('title department status createdAt');

    const jobSummaries = await Promise.all(
      jobs.map(async (j) => {
        const total = await Application.countDocuments({ jobId: j._id });
        const shortlisted = await Application.countDocuments({
          jobId: j._id,
          stage: { $in: ['Shortlisted', 'Interview', 'Offer', 'Hired'] },
        });
        const hired = await Application.countDocuments({ jobId: j._id, stage: 'Hired' });

        const avgScoreAgg = await ScreeningResult.aggregate([
          { $match: { jobId: j._id } },
          { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
        ]);

        return {
          jobId: j._id,
          title: j.title,
          department: j.department,
          status: j.status,
          totalCandidates: total,
          shortlistedCandidates: shortlisted,
          hiredCandidates: hired,
          avgMatchScore: avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 0,
        };
      })
    );

    // 2. Recruitment Funnel Analytics (stage drop-off rates)
    const funnelStages = ['New', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
    const funnelData = await Promise.all(
      funnelStages.map(async (stageName) => {
        const count = await Application.countDocuments({
          ...filter,
          stage: stageName,
        });
        return { stage: stageName, count };
      })
    );

    // 3. Top Skills Distribution across candidates in the talent pool
    const candidates = await Candidate.find({ organization: orgId }).select('skills');
    const skillCounts = {};
    candidates.forEach((c) => {
      (c.skills || []).forEach((s) => {
        skillCounts[s.name] = (skillCounts[s.name] || 0) + 1;
      });
    });

    const skillDistribution = Object.entries(skillCounts)
      .map(([name, count]) => ({ skill: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Candidate Ranking List
    const candidateRankings = await ScreeningResult.find(filter)
      .sort({ overallScore: -1 })
      .limit(50)
      .populate('candidateId', 'name email location totalExperienceYears')
      .populate('jobId', 'title department');

    res.status(200).json({
      success: true,
      data: {
        jobSummaries,
        funnelData,
        skillDistribution,
        candidateRankings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export candidate rankings to CSV format
// @route   GET /api/reports/export/csv
const exportRankingsCSV = async (req, res, next) => {
  try {
    const { jobId } = req.query;
    const filter = { organization: req.organizationId };
    if (jobId && jobId !== 'all') filter.jobId = jobId;

    const results = await ScreeningResult.find(filter)
      .sort({ overallScore: -1 })
      .populate('candidateId')
      .populate('jobId');

    // Build CSV string
    const headers = [
      'Candidate Name',
      'Email',
      'Job Title',
      'Overall Match Score',
      'Skill Alignment',
      'Semantic Similarity',
      'Experience Score',
      'Qualification Score',
      'Years Experience',
      'Matched Required Skills',
      'Missing Required Skills',
    ];

    const rows = results.map((r) => {
      const c = r.candidateId || {};
      const j = r.jobId || {};
      const matched = (r.matchedRequiredSkills || []).map((m) => m.skill).join('; ');
      const missing = (r.missingRequiredSkills || []).join('; ');

      return [
        `"${(c.name || 'Candidate').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(j.title || '').replace(/"/g, '""')}"`,
        r.overallScore,
        r.componentScores.skillAlignment,
        r.componentScores.semanticSimilarity,
        r.componentScores.experienceScore,
        r.componentScores.qualificationScore,
        c.totalExperienceYears || 0,
        `"${matched.replace(/"/g, '""')}"`,
        `"${missing.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'DATA_EXPORTED',
      entityType: 'Settings',
      details: { exportType: 'CSV_RANKINGS', rowCount: results.length },
      req,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=hiresense_candidate_rankings_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportsSummary,
  exportRankingsCSV,
};
