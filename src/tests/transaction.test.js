/**
 * src/tests/transaction.test.js
 * Integration tests for Transaction CRUD and filtering endpoints.
 */

const request = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const path = require('path');

const transactionsFile = path.join(__dirname, '../data/transactions.json');
const usersFile = path.join(__dirname, '../data/users.json');

describe('Transaction Endpoints Integration Tests', () => {
  const testUserId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';

  beforeEach(async () => {
    // Reset mock database files
    await fs.mkdir(path.dirname(transactionsFile), { recursive: true });
    await fs.writeFile(transactionsFile, JSON.stringify([], null, 2), 'utf8');

    // Seed a valid user so referential integrity check passes
    await fs.mkdir(path.dirname(usersFile), { recursive: true });
    await fs.writeFile(
      usersFile,
      JSON.stringify(
        [
          {
            id: testUserId,
            name: 'Akash Nair',
            email: 'akash@gmail.com',
            createdAt: new Date().toISOString()
          }
        ],
        null,
        2
      ),
      'utf8'
    );
  });

  afterAll(async () => {
    await fs.writeFile(transactionsFile, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');
  });

  describe('POST /transactions', () => {
    it('should create a transaction successfully and return status 201', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          userId: testUserId,
          type: 'expense',
          category: 'Food',
          amount: 250,
          description: 'Lunch',
          date: '2026-06-13'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.userId).toBe(testUserId);
      expect(res.body.data.type).toBe('expense');
      expect(res.body.data.category).toBe('Food');
      expect(res.body.data.amount).toBe(250);
      expect(res.body.data.date).toBe('2026-06-13');
    });

    it('should fail with 400 when user does not exist', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          userId: 'non-existent-user-uuid',
          type: 'expense',
          category: 'Food',
          amount: 250,
          description: 'Lunch',
          date: '2026-06-13'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should fail with 400 when amount is 0 or negative', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          userId: testUserId,
          type: 'expense',
          category: 'Food',
          amount: -5,
          date: '2026-06-13'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('amount must be greater than 0');
    });

    it('should fail with 400 when date format is invalid', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          userId: testUserId,
          type: 'expense',
          category: 'Food',
          amount: 100,
          date: '13-06-2026'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid date format (YYYY-MM-DD)');
    });
  });

  describe('GET /transactions (with filtering)', () => {
    beforeEach(async () => {
      const list = [
        {
          id: 'tx1',
          userId: testUserId,
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-06-01'
        },
        {
          id: 'tx2',
          userId: testUserId,
          type: 'expense',
          category: 'Food',
          amount: 150,
          date: '2026-06-10'
        },
        {
          id: 'tx3',
          userId: testUserId,
          type: 'expense',
          category: 'Food',
          amount: 300,
          date: '2026-07-15'
        }
      ];
      await fs.writeFile(transactionsFile, JSON.stringify(list, null, 2), 'utf8');
    });

    it('should return all transactions when no filter is provided', async () => {
      const res = await request(app).get('/transactions');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('should filter transactions by type', async () => {
      const res = await request(app).get('/transactions?type=expense');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every(t => t.type === 'expense')).toBe(true);
    });

    it('should filter transactions by category (case-insensitive)', async () => {
      const res = await request(app).get('/transactions?category=food');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter transactions by month and year combined', async () => {
      const res = await request(app).get('/transactions?month=6&year=2026');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /transactions/:id', () => {
    beforeEach(async () => {
      const list = [
        {
          id: 'tx123',
          userId: testUserId,
          type: 'expense',
          category: 'Utilities',
          amount: 120,
          date: '2026-06-01'
        }
      ];
      await fs.writeFile(transactionsFile, JSON.stringify(list, null, 2), 'utf8');
    });

    it('should return single transaction if it exists', async () => {
      const res = await request(app).get('/transactions/tx123');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Utilities');
    });

    it('should return 404 error if transaction does not exist', async () => {
      const res = await request(app).get('/transactions/txMissing');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Transaction not found');
    });
  });

  describe('PATCH /transactions/:id', () => {
    beforeEach(async () => {
      const list = [
        {
          id: 'tx456',
          userId: testUserId,
          type: 'expense',
          category: 'Utilities',
          amount: 120,
          date: '2026-06-01'
        }
      ];
      await fs.writeFile(transactionsFile, JSON.stringify(list, null, 2), 'utf8');
    });

    it('should partially update transaction successfully', async () => {
      const res = await request(app)
        .patch('/transactions/tx456')
        .send({
          amount: 150,
          category: 'Electricity'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(150);
      expect(res.body.data.category).toBe('Electricity');
      expect(res.body.data.type).toBe('expense');
    });

    it('should fail to update if new userId does not exist', async () => {
      const res = await request(app)
        .patch('/transactions/tx456')
        .send({
          userId: 'non-existent-user-uuid'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('DELETE /transactions/:id', () => {
    beforeEach(async () => {
      const list = [
        {
          id: 'tx789',
          userId: testUserId,
          type: 'expense',
          category: 'Entertainment',
          amount: 50,
          date: '2026-06-01'
        }
      ];
      await fs.writeFile(transactionsFile, JSON.stringify(list, null, 2), 'utf8');
    });

    it('should delete transaction successfully', async () => {
      const res = await request(app).delete('/transactions/tx789');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transaction deleted successfully');
    });

    it('should return 404 if transaction to delete does not exist', async () => {
      const res = await request(app).delete('/transactions/txMissing');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
