const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/customError');

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

const readUsersFile = async () => {
  try {
    const fileContent = await fs.readFile(USERS_FILE_PATH, 'utf8');
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new AppError('Failed to read users database', 500);
  }
};

const writeUsersFile = async (users) => {
  try {
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    throw new AppError('Failed to persist user data', 500);
  }
};

const registerUser = async (userData) => {
  const users = await readUsersFile();

  const isDuplicate = users.some(
    user => user.email.toLowerCase() === userData.email.toLowerCase()
  );

  if (isDuplicate) {
    throw new AppError('Email already exists', 400);
  }

  const newUser = {
    id: uuidv4(),
    name: userData.name,
    email: userData.email,
    CreatedDatetime: getFormattedDatetime()
  };

  users.push(newUser);
  await writeUsersFile(users);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    process.env.JWT_SECRET || 'super_secret_finedge_key_12345!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return { user: newUser, token };
};

const updateUser = async (id, updateData) => {
  const users = await readUsersFile();
  const index = users.findIndex(user => user.id === id);

  if (index === -1) {
    throw new AppError('User not found', 404);
  }

  if (updateData.email && updateData.email.toLowerCase() !== users[index].email.toLowerCase()) {
    const isDuplicate = users.some(
      user => user.email.toLowerCase() === updateData.email.toLowerCase()
    );
    if (isDuplicate) {
      throw new AppError('Email already exists', 400);
    }
  }

  const updatedUser = { ...users[index] };
  
  if (updateData.name !== undefined) {
    updatedUser.name = updateData.name;
  }
  if (updateData.email !== undefined) {
    updatedUser.email = updateData.email;
  }

  users[index] = updatedUser;
  await writeUsersFile(users);

  return updatedUser;
};

const deleteUser = async (id) => {
  const users = await readUsersFile();
  const index = users.findIndex(user => user.id === id);

  if (index === -1) {
    throw new AppError('User not found', 404);
  }

  users.splice(index, 1);
  await writeUsersFile(users);

  const transactionsPath = path.join(__dirname, '../data/transactions.json');
  try {
    const fileContent = await fs.readFile(transactionsPath, 'utf8');
    if (fileContent.trim()) {
      let transactions = JSON.parse(fileContent);
      transactions = transactions.filter(t => t.userId !== id);
      await fs.writeFile(transactionsPath, JSON.stringify(transactions, null, 2), 'utf8');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new AppError('Failed to update transactions database during user deletion', 500);
    }
  }

  return true;
};

module.exports = {
  registerUser,
  updateUser,
  deleteUser
};
