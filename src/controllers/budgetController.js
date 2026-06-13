const budgetService = require('../services/budgetService');

const create = async (req, res, next) => {
  try {
    const budget = await budgetService.createBudget(req.body);
    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create
};

