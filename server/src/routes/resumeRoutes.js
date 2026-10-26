const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadResumes, getResumeById } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/upload', upload.array('resumes', 15), uploadResumes);
router.get('/:id', getResumeById);

module.exports = router;
