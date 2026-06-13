const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { validateBudgetCreate } = require('../middleware/validator');

router.post('/', validateBudgetCreate, budgetController.create);

module.exports = router;

