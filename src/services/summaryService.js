const fs = require('fs/promises');
const path = require('path');
const AppError = require('../utils/customError');
const analytics = require('../utils/analytics');

const TRANSACTIONS_FILE_PATH = path.join(__dirname, '../data/transactions.json');
const BUDGETS_FILE_PATH = path.join(__dirname, '../data/budgets.json');

const readTransactionsFile = async () => {
  try {
    const fileContent = await fs.readFile(TRANSACTIONS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    const parsedData = JSON.parse(fileContent);
    if (!Array.isArray(parsedData)) {
      throw new AppError('Invalid transaction records structure', 500);
    }
    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to read transactions database', 500);
  }
};

const readBudgetsFile = async () => {
  try {
    const fileContent = await fs.readFile(BUDGETS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    const parsedData = JSON.parse(fileContent);
    if (!Array.isArray(parsedData)) {
      throw new AppError('Invalid budget records structure', 500);
    }
    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to read budgets database', 500);
  }
};

const getFinancialSummary = async () => {
  const transactions = await readTransactionsFile();
  const budgets = await readBudgetsFile();

  const baseSummary = analytics.calculateSummary(transactions);

  let totalBudget = 0;
  budgets.forEach(b => {
    totalBudget += Number(b.monthlybudget) || 0;
  });

  const expenseMap = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const amount = Number(t.amount) || 0;
      const catKey = t.category.toLowerCase();
      expenseMap[catKey] = (expenseMap[catKey] || 0) + amount;
    }
  });

  const categoryBudgets = budgets.map(b => {
    const actualExpense = expenseMap[b.category.toLowerCase()] || 0;
    return {
      category: b.category,
      monthlybudget: b.monthlybudget,
      actualExpense,
      remainingBudget: Math.max(0, b.monthlybudget - actualExpense),
      budgetExceeded: actualExpense > b.monthlybudget
    };
  });

  return {
    ...baseSummary,
    totalBudget,
    categoryBudgets
  };
};

const getCategoryWiseExpenses = async () => {
  const transactions = await readTransactionsFile();
  return analytics.getCategoryWiseExpenses(transactions);
};

const getMonthlyTrends = async () => {
  const transactions = await readTransactionsFile();
  return analytics.getMonthlyTrends(transactions);
};

const getTopCategories = async (limit) => {
  const transactions = await readTransactionsFile();
  return analytics.getTopCategories(transactions, limit);
};

module.exports = {
  getFinancialSummary,
  getCategoryWiseExpenses,
  getMonthlyTrends,
  getTopCategories
};

