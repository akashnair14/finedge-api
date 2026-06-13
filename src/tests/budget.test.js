const request = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const path = require('path');

const budgetsFile = path.join(__dirname, '../data/budgets.json');
const usersFile = path.join(__dirname, '../data/users.json');

describe('Budget Endpoints Integration Tests', () => {
  const testUserId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';

  beforeEach(async () => {
    await fs.mkdir(path.dirname(budgetsFile), { recursive: true });
    await fs.writeFile(budgetsFile, JSON.stringify([], null, 2), 'utf8');

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
    await fs.writeFile(budgetsFile, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');
  });

  describe('POST /budgets', () => {
    it('should create a new budget successfully and return status 201', async () => {
      const res = await request(app)
        .post('/budgets')
        .send({
          userId: testUserId,
          category: 'Food',
          monthlybudget: 5000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.userId).toBe(testUserId);
      expect(res.body.data.category).toBe('Food');
      expect(res.body.data.monthlybudget).toBe(5000);
    });

    it('should update the budget goal if a budget for the same user and category already exists', async () => {
      await request(app)
        .post('/budgets')
        .send({
          userId: testUserId,
          category: 'Food',
          monthlybudget: 5000
        });

      const res = await request(app)
        .post('/budgets')
        .send({
          userId: testUserId,
          category: 'Food',
          monthlybudget: 6000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlybudget).toBe(6000);

      const budgets = JSON.parse(await fs.readFile(budgetsFile, 'utf8'));
      expect(budgets.length).toBe(1);
    });

    it('should fail with 400 when user does not exist', async () => {
      const res = await request(app)
        .post('/budgets')
        .send({
          userId: 'non-existent-user-id',
          category: 'Food',
          monthlybudget: 5000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should fail with 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/budgets')
        .send({
          userId: testUserId,
          category: 'Food'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('monthlybudget is required');
    });

    it('should fail with 400 when monthlybudget is negative', async () => {
      const res = await request(app)
        .post('/budgets')
        .send({
          userId: testUserId,
          category: 'Food',
          monthlybudget: -20
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('monthlybudget must be a number greater than 0');
    });
  });
});

