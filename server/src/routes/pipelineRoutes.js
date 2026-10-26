const express = require('express');
const router = express.Router();
const {
  getPipelineBoard,
  updateCandidateStage,
  bulkUpdateStage,
  undoStageChange,
} = require('../controllers/pipelineController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getPipelineBoard);
router.patch('/:applicationId/stage', updateCandidateStage);
router.post('/bulk-stage', bulkUpdateStage);
router.post('/:applicationId/undo', undoStageChange);

module.exports = router;
