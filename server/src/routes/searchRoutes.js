const express = require('express');
const router = express.Router();
const {
  searchTalentPool,
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/talent-pool', searchTalentPool);
router.route('/saved')
  .get(getSavedSearches)
  .post(createSavedSearch);
router.delete('/saved/:id', deleteSavedSearch);

module.exports = router;
