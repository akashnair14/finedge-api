const userService = require('../services/userService');
const AppError = require('../utils/customError');

const register = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      throw new AppError('name is required', 400);
    }
    if (!email) {
      throw new AppError('email is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Please provide a valid email address', 400);
    }

    const { user: newUser, token } = await userService.registerUser({ name, email });

    res.status(201).json({
      success: true,
      token: token,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        CreatedDatetime: newUser.CreatedDatetime
      }
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (req.user.id !== id) {
      throw new AppError('You are not authorized to update this user', 403);
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Please provide a valid email address', 400);
      }
    }

    const updatedUser = await userService.updateUser(id, { name, email });

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        CreatedDatetime: updatedUser.CreatedDatetime
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      throw new AppError('You are not authorized to delete this user', 403);
    }

    await userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  update,
  delete: deleteUser
};

