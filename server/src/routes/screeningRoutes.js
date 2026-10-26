const express = require('express');
const router = express.Router();
const {
  getJobScreeningResults,
  getScreeningResultById,
  overrideScreeningScore,
  compareCandidates,
} = require('../controllers/screeningController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/job/:jobId', getJobScreeningResults);
router.get('/:id', getScreeningResultById);
router.patch('/:id/override', overrideScreeningScore);
router.post('/compare', compareCandidates);

module.exports = router;
