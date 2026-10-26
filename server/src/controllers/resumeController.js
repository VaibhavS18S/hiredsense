const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');
const ScreeningResult = require('../models/ScreeningResult');
const Notification = require('../models/Notification');
const ScoringConfig = require('../models/ScoringConfig');
const { extractRawText, parseResumeEntities } = require('../services/resumeParser/textExtractor');
const { extractSkillsFromText } = require('../services/skillExtractor/skillExtractor');
const { calculateCandidateMatch } = require('../services/matchingEngine/scoringEngine');
const { logActivity } = require('../services/auditLogger');

// @desc    Process single or bulk uploaded resumes
// @route   POST /api/resumes/upload
const uploadResumes = async (req, res, next) => {
  try {
    const files = req.files;
    const { jobId } = req.body;
    const orgId = req.organizationId;
    const userId = req.user._id;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one resume file' });
    }

    // Optional target job
    let targetJob = null;
    let customWeights = null;
    if (jobId) {
      targetJob = await Job.findOne({ _id: jobId, organization: orgId });
      const config = await ScoringConfig.findOne({ organization: orgId });
      if (config) customWeights = config.weights;
    }

    const processedResults = [];
    const errors = [];

    for (const file of files) {
      try {
        const filePath = file.path;
        const mimeType = file.mimetype;

        // 1. Text extraction & File Hash
        const { rawText, fileHash, fileSize } = await extractRawText(filePath, mimeType);

        // 2. Duplicate Detection
        const existingResume = await Resume.findOne({
          fileHash,
          organization: orgId,
        }).populate('candidateId');

        let isDuplicate = false;
        let duplicateOriginalId = null;

        if (existingResume) {
          isDuplicate = true;
          duplicateOriginalId = existingResume._id;
        }

        // 3. Information Parsing
        const parsed = parseResumeEntities(rawText);

        // 4. Skill Identification from our 500+ taxonomy
        const detectedSkills = extractSkillsFromText(rawText);

        // 5. Create or Find Candidate
        let candidate;
        if (parsed.email) {
          candidate = await Candidate.findOne({ email: parsed.email, organization: orgId });
        }

        if (!candidate) {
          candidate = await Candidate.create({
            name: parsed.name,
            email: parsed.email || `candidate-${Date.now()}@applicant.pool`,
            phone: parsed.phone,
            links: parsed.links,
            totalExperienceYears: parsed.totalExperienceYears,
            skills: detectedSkills,
            experienceTimeline: parsed.experienceTimeline,
            educationTimeline: parsed.educationTimeline,
            organization: orgId,
            source: 'Resume Screening Upload',
          });
        } else {
          // Update skills if newly detected
          const existingSkillNames = new Set(candidate.skills.map((s) => s.name));
          detectedSkills.forEach((s) => {
            if (!existingSkillNames.has(s.name)) {
              candidate.skills.push(s);
            }
          });
          await candidate.save();
        }

        // 6. Save Resume Document
        const resumeDoc = await Resume.create({
          candidateId: candidate._id,
          fileName: file.originalname,
          filePath: filePath,
          fileHash,
          fileSize,
          mimeType,
          rawText,
          confidenceScore: 92,
          qualityScore: parsed.qualityIssues.length === 0 ? 95 : Math.max(50, 95 - parsed.qualityIssues.length * 15),
          qualityIssues: parsed.qualityIssues,
          isDuplicate,
          duplicateOriginalId,
          organization: orgId,
          uploadedBy: userId,
        });

        // 7. If target job provided, match candidate and create Application + ScreeningResult
        let matchResult = null;
        if (targetJob) {
          matchResult = await calculateCandidateMatch(candidate, targetJob, rawText, customWeights);

          // Save or update screening result
          const screeningDoc = await ScreeningResult.findOneAndUpdate(
            { candidateId: candidate._id, jobId: targetJob._id },
            {
              resumeId: resumeDoc._id,
              overallScore: matchResult.overallScore,
              componentScores: matchResult.componentScores,
              weightsUsed: matchResult.weightsUsed,
              matchedRequiredSkills: matchResult.matchedRequiredSkills,
              matchedPreferredSkills: matchResult.matchedPreferredSkills,
              missingRequiredSkills: matchResult.missingRequiredSkills,
              missingPreferredSkills: matchResult.missingPreferredSkills,
              experienceEvidence: matchResult.experienceEvidence,
              qualificationEvidence: matchResult.qualificationEvidence,
              supportingExcerpts: matchResult.supportingExcerpts,
              dataQualityWarnings: matchResult.dataQualityWarnings,
              organization: orgId,
            },
            { upsert: true, new: true }
          );

          // Create or update application in pipeline
          const initialStage = matchResult.overallScore >= 75 ? 'Shortlisted' : 'Screening';
          await Application.findOneAndUpdate(
            { candidateId: candidate._id, jobId: targetJob._id },
            {
              $setOnInsert: {
                stage: initialStage,
                assignedRecruiter: userId,
                stageHistory: [{ stage: initialStage, changedBy: userId, note: 'Initial AI screening' }],
              },
              organization: orgId,
            },
            { upsert: true, new: true }
          );
        }

        processedResults.push({
          file: file.originalname,
          status: 'success',
          candidate: {
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            skillsCount: detectedSkills.length,
          },
          isDuplicate,
          qualityScore: resumeDoc.qualityScore,
          matchResult: matchResult ? {
            overallScore: matchResult.overallScore,
            componentScores: matchResult.componentScores,
          } : null,
        });

        // Clean up uploaded file if desired or keep in uploads
      } catch (fileErr) {
        errors.push({
          file: file.originalname,
          error: fileErr.message,
        });
      }
    }

    // Create Notification for the batch
    if (processedResults.length > 0) {
      await Notification.create({
        user: userId,
        title: 'Batch Resume Processing Complete',
        message: `Successfully analyzed ${processedResults.length} resume(s)${targetJob ? ` for ${targetJob.title}` : ''}.${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        type: 'batch_completed',
        link: targetJob ? `/jobs/${targetJob._id}` : '/candidates',
        organization: orgId,
      });

      await logActivity({
        organizationId: orgId,
        userId: userId,
        action: 'RESUMES_UPLOADED',
        entityType: 'Resume',
        details: { count: processedResults.length, errorsCount: errors.length, jobId },
        req,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        processed: processedResults,
        failed: errors,
        totalUploaded: files.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get raw resume text / preview
// @route   GET /api/resumes/:id
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    }).populate('candidateId');

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume document not found' });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResumes,
  getResumeById,
};
