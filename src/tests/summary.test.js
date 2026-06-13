/**
 * src/tests/summary.test.js
 * Integration tests for Financial Summary and Analytics endpoints with integrated budgets.
 */

const request = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const path = require('path');

const transactionsFile = path.join(__dirname, '../data/transactions.json');
const budgetsFile = path.join(__dirname, '../data/budgets.json');

describe('Financial Summary Endpoints Integration Tests', () => {
  const testUserId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';

  beforeEach(async () => {
    // Seed mock transactions
    const transactions = [
      {
        id: 't1',
        userId: testUserId,
        amount: 50000,
        type: 'income',
        category: 'Salary',
        date: '2026-06-01'
      },
      {
        id: 't2',
        userId: testUserId,
        amount: 10000,
        type: 'expense',
        category: 'Rent',
        date: '2026-06-02'
      },
      {
        id: 't3',
        userId: testUserId,
        amount: 5000,
        type: 'expense',
        category: 'Food',
        date: '2026-06-03'
      },
      {
        id: 't4',
        userId: testUserId,
        amount: 12000,
        type: 'expense',
        category: 'Rent',
        date: '2026-07-01'
      }
    ];
    await fs.mkdir(path.dirname(transactionsFile), { recursive: true });
    await fs.writeFile(transactionsFile, JSON.stringify(transactions, null, 2), 'utf8');

    // Seed mock budgets
    const budgets = [
      {
        id: 'b1',
        userId: testUserId,
        category: 'Rent',
        monthlybudget: 20000
      },
      {
        id: 'b2',
        userId: testUserId,
        category: 'Food',
        monthlybudget: 6000
      }
    ];
    await fs.mkdir(path.dirname(budgetsFile), { recursive: true });
    await fs.writeFile(budgetsFile, JSON.stringify(budgets, null, 2), 'utf8');
  });

  afterAll(async () => {
    await fs.writeFile(transactionsFile, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(budgetsFile, JSON.stringify([], null, 2), 'utf8');
  });

  describe('GET /summary', () => {
    it('should calculate financial summary and budget comparison from transactions and budgets', async () => {
      const res = await request(app).get('/summary');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(50000);
      expect(res.body.data.totalExpense).toBe(27000); // 10000 + 5000 + 12000 = 27000
      expect(res.body.data.balance).toBe(23000); // 50000 - 27000 = 23000
      expect(res.body.data.transactionCount).toBe(4);

      // Verify budget properties
      expect(res.body.data.totalBudget).toBe(26000); // 20000 + 6000

      // Verify category budget list
      expect(res.body.data.categoryBudgets).toEqual(
        expect.arrayContaining([
          {
            category: 'Rent',
            monthlybudget: 20000,
            actualExpense: 22000, // 10000 + 12000
            remainingBudget: 0,
            budgetExceeded: true // 22000 > 20000
          },
          {
            category: 'Food',
            monthlybudget: 6000,
            actualExpense: 5000,
            remainingBudget: 1000,
            budgetExceeded: false // 5000 <= 6000
          }
        ])
      );
    });
  });

  describe('GET /summary/category', () => {
    it('should return expenses grouped by category', async () => {
      const res = await request(app).get('/summary/category');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          { category: 'Rent', total: 22000 },
          { category: 'Food', total: 5000 }
        ])
      );
    });
  });

  describe('GET /summary/monthly', () => {
    it('should generate monthly spending trends sorted by month ascending', async () => {
      const res = await request(app).get('/summary/monthly');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toEqual({
        month: '2026-06',
        income: 50000,
        expense: 15000,
        balance: 35000
      });
      expect(res.body.data[1]).toEqual({
        month: '2026-07',
        income: 0,
        expense: 12000,
        balance: -12000
      });
    });
  });

  describe('GET /summary/top-categories', () => {
    it('should return top spending categories sorted descending', async () => {
      const res = await request(app).get('/summary/top-categories');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].category).toBe('Rent');
      expect(res.body.data[0].amount).toBe(22000);
      expect(res.body.data[1].category).toBe('Food');
      expect(res.body.data[1].amount).toBe(5000);
    });

    it('should respect the limit parameter', async () => {
      const res = await request(app).get('/summary/top-categories?limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Rent');
    });
  });
});
