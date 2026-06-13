const { 
  validateTransactionCreate, 
  validateTransactionUpdate 
} = require('../middleware/validator');
const AppError = require('../utils/customError');

describe('Validator Middleware Unit Tests', () => {
  describe('validateTransactionCreate', () => {
    it('should call next with AppError if userId is missing', () => {
      const req = { body: { type: 'income', category: 'Salary', amount: 50000, date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('userId is required');
    });

    it('should call next with AppError if type is missing', () => {
      const req = { body: { userId: 'u1', category: 'Salary', amount: 50000, date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('type is required');
    });

    it('should call next with AppError if type is invalid', () => {
      const req = { body: { userId: 'u1', type: 'investment', category: 'Salary', amount: 50000, date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('type must be either income or expense');
    });

    it('should call next with AppError if category is missing', () => {
      const req = { body: { userId: 'u1', type: 'income', amount: 50000, date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('category is required');
    });

    it('should call next with AppError if amount is missing', () => {
      const req = { body: { userId: 'u1', type: 'income', category: 'Salary', date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('amount is required');
    });

    it('should call next with AppError if amount is 0 or negative', () => {
      const req = { body: { userId: 'u1', type: 'income', category: 'Salary', amount: -50, date: '2026-06-13' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('amount must be greater than 0');
    });

    it('should call next with AppError if date is missing', () => {
      const req = { body: { userId: 'u1', type: 'income', category: 'Salary', amount: 50000 } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('date is required');
    });

    it('should call next with AppError if date format is invalid', () => {
      const req = { body: { userId: 'u1', type: 'income', category: 'Salary', amount: 50000, date: '13-06-2026' } };
      const res = {};
      const next = jest.fn();

      validateTransactionCreate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('valid date format (YYYY-MM-DD) is required');
    });
  });

  describe('validateTransactionUpdate', () => {
    it('should call next with AppError if type is invalid', () => {
      const req = { body: { type: 'investment' } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError if userId is empty', () => {
      const req = { body: { userId: '' } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('userId must be a non-empty string');
    });

    it('should call next with AppError if category is empty', () => {
      const req = { body: { category: '   ' } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('category must be a non-empty string');
    });

    it('should call next with AppError if amount is negative', () => {
      const req = { body: { amount: -10 } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError if date format is invalid', () => {
      const req = { body: { date: 'invalid-date' } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with no args for valid updates', () => {
      const req = { body: { amount: 100, type: 'expense', date: '2026-06-13', userId: 'u1', category: 'Food' } };
      const res = {};
      const next = jest.fn();

      validateTransactionUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
