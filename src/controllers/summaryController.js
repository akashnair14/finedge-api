const summaryService = require('../services/summaryService');

const getSummary = async (req, res, next) => {
  try {
    const summary = await summaryService.getFinancialSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryWiseExpenses = async (req, res, next) => {
  try {
    const categoryExpenses = await summaryService.getCategoryWiseExpenses();
    res.status(200).json({
      success: true,
      data: categoryExpenses
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const trends = await summaryService.getMonthlyTrends();
    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

const getTopCategories = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const topCategories = await summaryService.getTopCategories(limit);
    res.status(200).json({
      success: true,
      data: topCategories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getCategoryWiseExpenses,
  getMonthlyTrends,
  getTopCategories
};

