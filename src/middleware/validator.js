const AppError = require('../utils/customError');

const validateTransactionCreate = (req, res, next) => {
  const { userId, type, category, amount, date } = req.body;

  if (!userId) {
    return next(new AppError('userId is required', 400));
  }
  if (!type) {
    return next(new AppError('type is required', 400));
  }
  if (type !== 'income' && type !== 'expense') {
    return next(new AppError('type must be either income or expense', 400));
  }
  if (!category) {
    return next(new AppError('category is required', 400));
  }
  if (amount === undefined || amount === null) {
    return next(new AppError('amount is required', 400));
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return next(new AppError('amount must be greater than 0', 400));
  }
  if (!date) {
    return next(new AppError('date is required', 400));
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
    return next(new AppError('valid date format (YYYY-MM-DD) is required', 400));
  }

  next();
};

const validateTransactionUpdate = (req, res, next) => {
  const { type, amount, date, userId, category } = req.body;

  if (userId !== undefined && (typeof userId !== 'string' || !userId.trim())) {
    return next(new AppError('userId must be a non-empty string', 400));
  }
  if (type !== undefined && type !== 'income' && type !== 'expense') {
    return next(new AppError('type must be either income or expense', 400));
  }
  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    return next(new AppError('category must be a non-empty string', 400));
  }
  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    return next(new AppError('amount must be greater than 0', 400));
  }
  if (date !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
      return next(new AppError('valid date format (YYYY-MM-DD) is required', 400));
    }
  }

  next();
};

const validateBudgetCreate = (req, res, next) => {
  const { userId, category, monthlybudget } = req.body;

  if (!userId) {
    return next(new AppError('userId is required', 400));
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    return next(new AppError('category is required and must be a non-empty string', 400));
  }
  if (monthlybudget === undefined || monthlybudget === null) {
    return next(new AppError('monthlybudget is required', 400));
  }
  if (typeof monthlybudget !== 'number' || monthlybudget <= 0) {
    return next(new AppError('monthlybudget must be a number greater than 0', 400));
  }

  next();
};

module.exports = {
  validateTransactionCreate,
  validateTransactionUpdate,
  validateBudgetCreate
};
