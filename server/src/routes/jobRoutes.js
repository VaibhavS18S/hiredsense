const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  duplicateJob,
  updateJobStatus,
  deleteJob,
  analyzeJob,
  enhanceJobWithAI,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getJobs)
  .post(createJob);

router.post('/analyze', analyzeJob);
router.post('/enhance', enhanceJobWithAI);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

router.post('/:id/duplicate', duplicateJob);
router.patch('/:id/status', updateJobStatus);

module.exports = router;
