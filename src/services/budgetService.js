const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/customError');

const BUDGETS_FILE_PATH = path.join(__dirname, '../data/budgets.json');
const USERS_FILE_PATH = path.join(__dirname, '../data/users.json');

const getFormattedDatetime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const verifyUserExists = async (userId) => {
  try {
    const fileContent = await fs.readFile(USERS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      throw new AppError('User not found', 400);
    }
    const users = JSON.parse(fileContent);
    const exists = users.some(user => user.id === userId);
    if (!exists) {
      throw new AppError('User not found', 400);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error.code === 'ENOENT') {
      throw new AppError('User not found', 400);
    }
    throw new AppError('Failed to read users database', 500);
  }
};

const readBudgetsFile = async () => {
  try {
    const fileContent = await fs.readFile(BUDGETS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new AppError('Failed to read budgets database', 500);
  }
};

const writeBudgetsFile = async (budgets) => {
  try {
    await fs.mkdir(path.dirname(BUDGETS_FILE_PATH), { recursive: true });
    await fs.writeFile(BUDGETS_FILE_PATH, JSON.stringify(budgets, null, 2), 'utf8');
  } catch (error) {
    throw new AppError('Failed to save budget data', 500);
  }
};

const createBudget = async (budgetData) => {
  await verifyUserExists(budgetData.userId);

  const budgets = await readBudgetsFile();

  const existingIndex = budgets.findIndex(
    b => b.userId === budgetData.userId && b.category.toLowerCase() === budgetData.category.toLowerCase()
  );

  let resultBudget;

  if (existingIndex !== -1) {
    resultBudget = {
      ...budgets[existingIndex],
      monthlybudget: budgetData.monthlybudget,
      UpdatedDatetime: getFormattedDatetime()
    };
    budgets[existingIndex] = resultBudget;
  } else {
    resultBudget = {
      id: uuidv4(),
      userId: budgetData.userId,
      category: budgetData.category,
      monthlybudget: budgetData.monthlybudget,
      CreatedDatetime: getFormattedDatetime()
    };
    budgets.push(resultBudget);
  }

  await writeBudgetsFile(budgets);
  return resultBudget;
};

module.exports = {
  createBudget
};

