const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/customError');

const TRANSACTIONS_FILE_PATH = path.join(__dirname, '../data/transactions.json');
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

const readTransactionsFile = async () => {
  try {
    const fileContent = await fs.readFile(TRANSACTIONS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new AppError('Failed to read transactions database', 500);
  }
};

const writeTransactionsFile = async (transactions) => {
  try {
    await fs.mkdir(path.dirname(TRANSACTIONS_FILE_PATH), { recursive: true });
    await fs.writeFile(TRANSACTIONS_FILE_PATH, JSON.stringify(transactions, null, 2), 'utf8');
  } catch (error) {
    throw new AppError('Failed to save transaction data', 500);
  }
};

const createTransaction = async (transactionData) => {
  await verifyUserExists(transactionData.userId);

  const transactions = await readTransactionsFile();

  const newTransaction = {
    id: uuidv4(),
    userId: transactionData.userId,
    type: transactionData.type,
    category: transactionData.category,
    amount: transactionData.amount,
    description: transactionData.description || '',
    date: transactionData.date,
    CreatedDatetime: getFormattedDatetime()
  };

  transactions.push(newTransaction);
  await writeTransactionsFile(transactions);

  return newTransaction;
};

const getTransactions = async (filters = {}) => {
  let list = await readTransactionsFile();

  if (filters.type) {
    list = list.filter(t => t.type === filters.type);
  }

  if (filters.category) {
    list = list.filter(t => t.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.year) {
    const targetYear = parseInt(filters.year, 10);
    list = list.filter(t => {
      if (!t.date) return false;
      const parts = t.date.split('-');
      return parseInt(parts[0], 10) === targetYear;
    });
  }

  if (filters.month) {
    const targetMonth = parseInt(filters.month, 10);
    list = list.filter(t => {
      if (!t.date) return false;
      const parts = t.date.split('-');
      return parseInt(parts[1], 10) === targetMonth;
    });
  }

  return list;
};

const getTransactionById = async (id) => {
  const transactions = await readTransactionsFile();
  const transaction = transactions.find(t => t.id === id);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

const updateTransaction = async (id, updateData) => {
  const transactions = await readTransactionsFile();
  const index = transactions.findIndex(t => t.id === id);

  if (index === -1) {
    throw new AppError('Transaction not found', 404);
  }

  if (updateData.userId !== undefined) {
    await verifyUserExists(updateData.userId);
  }

  const editableFields = ['type', 'category', 'amount', 'description', 'date', 'userId'];
  const updatedTransaction = { ...transactions[index] };

  for (const field of editableFields) {
    if (updateData[field] !== undefined) {
      updatedTransaction[field] = updateData[field];
    }
  }

  transactions[index] = updatedTransaction;
  await writeTransactionsFile(transactions);

  return updatedTransaction;
};

const deleteTransaction = async (id) => {
  const transactions = await readTransactionsFile();
  const index = transactions.findIndex(t => t.id === id);

  if (index === -1) {
    throw new AppError('Transaction not found', 404);
  }

  transactions.splice(index, 1);
  await writeTransactionsFile(transactions);

  return true;
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};

