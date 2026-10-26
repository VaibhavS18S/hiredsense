const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidateById,
  updateCandidateData,
  addCandidateNote,
} = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.put('/:id', updateCandidateData);
router.post('/:id/notes', addCandidateNote);

module.exports = router;
