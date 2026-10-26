const express = require('express');
const router = express.Router();
const {
  getScoringConfig,
  updateScoringConfig,
  getOrganizationSettings,
  updateOrganizationSettings,
  getTeamMembers,
  addTeamMember,
  exportCandidateDataGDPR,
  deleteCandidateGDPR,
  getAuditLogs,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Scoring Weights
router.route('/scoring')
  .get(getScoringConfig)
  .put(authorize('admin', 'recruiter'), updateScoringConfig);

// Organization & Privacy
router.route('/organization')
  .get(getOrganizationSettings)
  .put(authorize('admin'), updateOrganizationSettings);

// Team Members
router.route('/team')
  .get(getTeamMembers)
  .post(authorize('admin'), addTeamMember);

// GDPR Compliance
router.get('/privacy/export/:candidateId', authorize('admin', 'recruiter'), exportCandidateDataGDPR);
router.delete('/privacy/delete/:candidateId', authorize('admin'), deleteCandidateGDPR);

// Audit Logs
router.get('/audit', authorize('admin', 'recruiter'), getAuditLogs);

module.exports = router;
