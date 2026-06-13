const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

router.get('/', summaryController.getSummary);
router.get('/category', summaryController.getCategoryWiseExpenses);
router.get('/monthly', summaryController.getMonthlyTrends);
router.get('/top-categories', summaryController.getTopCategories);

module.exports = router;

