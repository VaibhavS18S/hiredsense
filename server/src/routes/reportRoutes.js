const express = require('express');
const router = express.Router();
const { getReportsSummary, exportRankingsCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getReportsSummary);
router.get('/export/csv', exportRankingsCSV);

module.exports = router;
