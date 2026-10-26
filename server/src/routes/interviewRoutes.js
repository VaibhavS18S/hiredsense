const express = require('express');
const router = express.Router();
const {
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getInterviews)
  .post(createInterview);

router.route('/:id')
  .get(getInterviewById)
  .put(updateInterview);

module.exports = router;
