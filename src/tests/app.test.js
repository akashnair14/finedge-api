/**
 * src/tests/app.test.js
 * Unit and integration tests for App utilities, error handlers, and file system error flows.
 */

const request = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const errorHandler = require('../middleware/errorHandler');
const AppError = require('../utils/customError');

describe('App Utilities & Middleware Tests', () => {
  describe('GET /health', () => {
    it('should return status 200 with UP message', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('GET /unmatched-route', () => {
    it('should return status 404 with route not found message', async () => {
      const res = await request(app).get('/unmatched-route-xyz');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Global Error Handler Middleware', () => {
    it('should mask unexpected non-operational errors as 500 Internal Server Error', () => {
      const req = {};
      const res = {
        statusCode: null,
        jsonPayload: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.jsonPayload = payload;
          return this;
        }
      };
      const next = jest.fn();

      const unexpectedError = new Error('Database connection crashed'); // isOperational is not set
      errorHandler(unexpectedError, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.jsonPayload.success).toBe(false);
      expect(res.jsonPayload.message).toBe('Internal Server Error');
    });
  });

  describe('File System Exception Safety Checks', () => {
    it('should handle read exceptions and bubble up custom AppError', async () => {
      const originalReadFile = fs.readFile;
      try {
        fs.readFile = () => {
          throw new Error('Mock disk read failure');
        };
        const summaryService = require('../services/summaryService');
        await expect(summaryService.getFinancialSummary()).rejects.toThrow(AppError);
      } finally {
        fs.readFile = originalReadFile;
      }
    });

    it('should handle write exceptions and bubble up custom AppError', async () => {
      const originalWriteFile = fs.writeFile;
      try {
        fs.writeFile = () => {
          throw new Error('Mock disk write failure');
        };
        const transactionService = require('../services/transactionService');
        await expect(
          transactionService.createTransaction({
            userId: '1a2b',
            type: 'income',
            category: 'Salary',
            amount: 50,
            date: '2026-06-13'
          })
        ).rejects.toThrow(AppError);
      } finally {
        fs.writeFile = originalWriteFile;
      }
    });
  });
});
